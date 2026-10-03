import type { UserRole } from '../types/church';

export const capabilities = ['self','directory','attendance','care','confidential_care','prayer_moderate','documents','kiosk','finance','staff'] as const;
export type Capability = typeof capabilities[number];
export const roleCapabilities: Record<UserRole, readonly Capability[]> = {
  member: ['self'],
  pastor: ['self','directory','attendance','care','confidential_care','prayer_moderate','documents','kiosk'],
  admin: ['self','directory','attendance','care','prayer_moderate','documents','kiosk','finance','staff'],
};
export function can(role: UserRole, capability: Capability) { return roleCapabilities[role].includes(capability); }
export const routeCapabilities: Record<string, Capability> = {
  '/': 'self', '/members': 'directory', '/giving': 'self', '/pastoral-care': 'care', '/documents': 'documents',
  '/prayer-wall': 'self', '/sermons': 'self', '/communications': 'care', '/financials': 'finance', '/admin': 'staff', '/settings': 'self',
};
