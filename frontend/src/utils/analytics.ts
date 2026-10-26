/**
 * PolyLance Privacy-First Event Telemetry
 * Non-invasive event logging for landing interactions.
 * Zero PII, zero tracking cookies, zero third-party surveillance scripts.
 */

export type LandingEventName =
  | 'landing_audience_toggle'
  | 'landing_video_open'
  | 'landing_video_close'
  | 'landing_simulator_calc'
  | 'landing_dispute_expand'
  | 'landing_contract_copy'
  | 'landing_verify_click'
  | 'landing_cta_click'
  | 'landing_tab_change';

export interface LandingEventPayload {
  [key: string]: string | number | boolean | undefined;
}

export function trackLandingEvent(name: LandingEventName, payload?: LandingEventPayload): void {
  try {
    if (typeof window === 'undefined') return;

    // Dispatch custom DOM event for any internal listeners
    const event = new CustomEvent('polylance:telemetry', {
      detail: {
        name,
        payload,
        timestamp: Date.now(),
      },
    });
    window.dispatchEvent(event);

    if (import.meta.env.DEV) {
      // Clean, low-overhead development log
      // console.debug(`[Telemetry] ${name}`, payload);
    }
  } catch {
    // Fail silently without disrupting user experience
  }
}
