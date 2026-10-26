/**
 * PolyLance Shared Navigation Configuration
 *
 * Single source of truth for the "More" dropdown menu, mobile menu sections,
 * and mirrored navigation lists across the application.
 *
 * Ordered as strictly specified:
 * 1. Reputation & Governance
 * 2. Protocol
 * 3. Legal & Compliance
 *
 * Excludes admin-only, private, or internal studio items.
 */

import {
  Trophy,
  Award,
  Share2,
  Scale,
  Layers,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  FileText,
  Lock,
  AlertTriangle,
  Calculator,
  LucideIcon,
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  to: string;
  icon: LucideIcon;
  description?: string;
}

export interface NavigationGroup {
  id: string;
  title: string;
  items: NavigationItem[];
}

export const MORE_MENU_GROUPS: NavigationGroup[] = [
  {
    id: 'reputation-governance',
    title: 'Reputation & Governance',
    items: [
      { id: 'leaderboard', label: 'Leaderboard & Reputation', to: '/reputation', icon: Trophy },
      { id: 'attestation', label: 'Attestation Reports', to: '/attestation', icon: Award },
      { id: 'dao', label: 'DAO Governance', to: '/dao', icon: Share2 },
      { id: 'judge', label: 'Judge Panel', to: '/judge', icon: Scale },
    ],
  },
  {
    id: 'protocol',
    title: 'Protocol',
    items: [
      { id: 'how-it-works', label: 'How It Works', to: '/how-it-works', icon: Layers },
      { id: 'escrow-simulator', label: 'Escrow Simulator', to: '/escrow-simulator', icon: Calculator },
      { id: 'fees', label: 'Fee Schedule', to: '/fees', icon: DollarSign },
      { id: 'security', label: 'Security Architecture', to: '/security', icon: ShieldCheck },
      { id: 'auditx', label: 'AuditX Security', to: '/auditx', icon: ShieldAlert },
      { id: 'faq', label: 'FAQ Hub', to: '/faq', icon: HelpCircle },
    ],
  },
  {
    id: 'legal-compliance',
    title: 'Legal & Compliance',
    items: [
      { id: 'terms', label: 'Terms of Service', to: '/terms', icon: FileText },
      { id: 'privacy', label: 'Privacy Policy', to: '/privacy', icon: Lock },
      { id: 'risk-notice', label: 'Risk Notice', to: '/disclaimer', icon: AlertTriangle },
    ],
  },
];
