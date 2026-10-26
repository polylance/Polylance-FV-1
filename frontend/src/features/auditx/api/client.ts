/**
 * AuditX API Client
 * Connects to the AuditX analysis engine backend or delegates to mockAdapter in local dev.
 */

import {
  AuditXCapabilities,
  CreateScanPayload,
  ScanJob,
  AuditXReport,
} from './types';
import { mockAuditXApi, MOCK_CAPABILITIES, STATIC_SAMPLE_REPORT } from './mockAdapter';
import { getBaseApiUrl } from '../../../utils/apiClient';

const isMockEnabled =
  !import.meta.env.PROD &&
  (import.meta.env.VITE_AUDITX_USE_MOCK === 'true' || import.meta.env.AUDITX_USE_MOCK === 'true');

function getAuditXBaseUrl(): string {
  const envUrl = import.meta.env.VITE_AUDITX_API_BASE_URL || import.meta.env.AUDITX_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  return getBaseApiUrl();
}

export class AuditXApiError extends Error {
  status: number;
  code?: string;
  data?: any;

  constructor(message: string, status: number, code?: string, data?: any) {
    super(message);
    this.name = 'AuditXApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getAuditXBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errBody: any = null;
    try {
      errBody = await response.json();
    } catch {
      errBody = await response.text();
    }
    const message =
      (typeof errBody === 'object' && errBody?.error) ||
      (typeof errBody === 'object' && errBody?.message) ||
      `AuditX API request failed with status ${response.status}`;

    throw new AuditXApiError(
      message,
      response.status,
      typeof errBody === 'object' ? errBody?.code : undefined,
      errBody
    );
  }

  if (response.status === 204) {
    return true as unknown as T;
  }

  return response.json();
}

export const auditxApi = {
  isMockActive: () => isMockEnabled,

  /**
   * Fetches service capabilities, supported languages, file limits, and pricing.
   */
  getCapabilities: async (): Promise<AuditXCapabilities> => {
    if (isMockEnabled) {
      return mockAuditXApi.getCapabilities();
    }
    try {
      return await request<AuditXCapabilities>('/api/auditx/capabilities');
    } catch (err) {
      // If backend is unavailable or not yet implemented by the other team, fallback safely
      console.warn('[AuditX] Failed to fetch capabilities, using fallback capabilities schema', err);
      return MOCK_CAPABILITIES;
    }
  },

  /**
   * Submits a new scan request (file upload, code snippet, or on-chain contract).
   */
  createScan: async (payload: CreateScanPayload): Promise<ScanJob> => {
    if (isMockEnabled) {
      return mockAuditXApi.createScan(payload);
    }

    if (payload.targetType === 'files' && payload.files && payload.files.length > 0) {
      const formData = new FormData();
      formData.append('targetType', 'files');
      formData.append('language', payload.language);
      formData.append('compilerVersion', payload.compilerVersion);
      if (payload.projectName) formData.append('projectName', payload.projectName);
      if (payload.notes) formData.append('notes', payload.notes);

      for (const file of payload.files) {
        formData.append('files', file);
      }

      return request<ScanJob>('/api/auditx/scans', {
        method: 'POST',
        body: formData,
      });
    }

    return request<ScanJob>('/api/auditx/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retrieves list of recent scans for the authenticated user.
   */
  getScans: async (): Promise<ScanJob[]> => {
    if (isMockEnabled) {
      return mockAuditXApi.getScans();
    }
    return request<ScanJob[]>('/api/auditx/scans');
  },

  /**
   * Retrieves status for an ongoing or completed scan job.
   */
  getScan: async (id: string): Promise<ScanJob | null> => {
    if (isMockEnabled) {
      return mockAuditXApi.getScan(id);
    }
    try {
      return await request<ScanJob>(`/api/auditx/scans/${id}`);
    } catch (err: any) {
      if (err.status === 404) return null;
      throw err;
    }
  },

  /**
   * Retrieves the detailed audit report for a completed scan.
   */
  getReport: async (reportOrScanId: string): Promise<AuditXReport | null> => {
    if (isMockEnabled) {
      return mockAuditXApi.getReport(reportOrScanId);
    }
    if (reportOrScanId === 'sample') {
      return STATIC_SAMPLE_REPORT;
    }
    try {
      return await request<AuditXReport>(`/api/auditx/scans/${reportOrScanId}/report`);
    } catch (err: any) {
      if (err.status === 404) return null;
      throw err;
    }
  },

  /**
   * Deletes a scan and associated artifacts/reports.
   */
  deleteScan: async (id: string): Promise<boolean> => {
    if (isMockEnabled) {
      return mockAuditXApi.deleteScan(id);
    }
    await request<void>(`/api/auditx/scans/${id}`, { method: 'DELETE' });
    return true;
  },

  /**
   * Cancels an ongoing scan if supported.
   */
  cancelScan: async (id: string): Promise<boolean> => {
    if (isMockEnabled) {
      return mockAuditXApi.cancelScan(id);
    }
    await request<void>(`/api/auditx/scans/${id}/cancel`, { method: 'POST' });
    return true;
  },

  /**
   * Admin-only: Fetches internal PolyLance smart contract security report.
   * Server must return 403 Forbidden for non-admins.
   */
  getAdminInternalReport: async (): Promise<any> => {
    return request<any>('/api/auditx/internal-report');
  },
};
