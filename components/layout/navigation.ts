import {
  Home, CalendarCheck, Users, Heart, HandHeart, FileText,
  Radio, MessageSquare, Activity, Landmark, ScanLine, ShieldCheck, Settings,
  type LucideIcon,
} from 'lucide-react';
import { can, routeCapabilities } from '../../lib/auth/permissions';
import type { UserRole } from '../../lib/types/church';

export type NavigationItem = { label: string; href: string; icon: LucideIcon; badge?: 'care' };

// Presentation is shared; the existing capability map remains the permission source.
export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard Overview', href: '/', icon: Home },
  { label: 'Services & Attendance', href: '/attendance', icon: CalendarCheck },
  { label: 'Member Directory', href: '/members', icon: Users },
  { label: 'Online Giving & Tithe', href: '/giving', icon: Heart },
  { label: 'Pastoral Care & At-Risk', href: '/pastoral-care', icon: HandHeart, badge: 'care' },
  { label: 'Pastoral Documents', href: '/documents', icon: FileText },
  { label: 'Prayer Wall & Testimonies', href: '/prayer-wall', icon: HandHeart },
  { label: 'Sermon & Media Hub', href: '/sermons', icon: Radio },
  { label: 'SMS Broadcasts', href: '/communications', icon: MessageSquare },
  { label: 'Operational status', href: '/operations', icon: Activity },
  { label: 'Financial Ledger', href: '/financials', icon: Landmark },
  { label: 'Tablet Entrance Kiosk', href: '/kiosk', icon: ScanLine },
  { label: 'Admin Management Panel', href: '/admin', icon: ShieldCheck },
  { label: 'User Account Settings', href: '/settings', icon: Settings },
];

export const mobileNavigation = [
  { href: '/', label: 'Home' },
  { href: '/giving', label: 'Giving' },
  { href: '/prayer-wall', label: 'Prayer' },
  { href: '/sermons', label: 'Sermons' },
].map(item => ({ ...navigationItems.find(nav => nav.href === item.href)!, label: item.label }));

export function permittedNavigation(role: UserRole) {
  return navigationItems.filter(item => can(role, routeCapabilities[item.href] || 'kiosk'));
}

export function isCurrentRoute(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
}
