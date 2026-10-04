'use client';
import { useRouter } from 'next/navigation';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type {
  Member, UserRole, CareNote, Sermon, Broadcast,
  GuestRetentionItem, SystemUser, AuditLog, PrayerRequest, PrayerStatus,
  PastoralDocument
} from '../types/church';

interface ChurchContextType {
  currentUser: SystemUser | null;
  updateCurrentUser: (updates: Partial<SystemUser>) => void;
  logout: () => Promise<void>;
  currentRole: UserRole;
  systemUsers: SystemUser[];
  addUser: (user: Omit<SystemUser, 'id' | 'created_at'>) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  members: Member[];
  addMember: (member: Omit<Member, 'id' | 'consecutive_absences' | 'last_attended_at' | 'first_visited_at'>) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  sermons: Sermon[];
  addSermon: (sermon: Omit<Sermon, 'id' | 'views_count'>) => void;
  toggleLiveSermon: (sermonId: string) => void;
  careNotes: CareNote[];
  addCareNote: (note: Omit<CareNote, 'id' | 'created_at'>) => void;
  broadcasts: Broadcast[];
  sendBroadcast: (broadcast: Omit<Broadcast, 'id' | 'created_at'>) => void;
  guestRetention: GuestRetentionItem[];
  updateGuestRetention: (id: string, updates: Partial<GuestRetentionItem>) => void;
  recordAttendance: (memberIds: string[], eventType: 'Sunday Service' | 'Mid-week Cell' | 'Night Vigil') => void;
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string) => void;
  prayerRequests: PrayerRequest[];
  addPrayerRequest: (request: Omit<PrayerRequest, 'id' | 'status' | 'prayed_count' | 'created_at' | 'comments' | 'updates'>) => void;
  incrementPrayerCount: (id: string) => void;
  updatePrayerStatus: (id: string, status: PrayerStatus) => void;
  deletePrayerRequest: (id: string) => void;
  addPrayerComment: (requestId: string, text: string, authorName: string) => void;
  addPrayerUpdate: (requestId: string, text: string, authorName: string) => void;
  pastoralDocuments: PastoralDocument[];
  addPastoralDocument: (doc: Omit<PastoralDocument, 'id' | 'created_at' | 'last_edited_at'>) => void;
  updatePastoralDocument: (id: string, updates: Partial<PastoralDocument>) => void;
  deletePastoralDocument: (id: string) => void;
  pendingOfflineCount: number;
  syncOfflineCheckIns: () => void;
  isOnline: boolean;
  isLive: boolean;
  setIsLive: (isLive: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

// Replace each operation with its verified backend service in later phases.
// Rejecting here prevents unfinished consumers from claiming successful writes.
const unavailableOperation = (): never => {
  throw new Error('This operation is unavailable until its backend service is implemented.');
};

export const ChurchProvider: React.FC<{ children: React.ReactNode; initialUser?: SystemUser | null }> = ({ children, initialUser = null }) => {
  const router=useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const value = useMemo<ChurchContextType>(() => ({
    currentUser: initialUser,
    currentRole: initialUser?.role || 'member',
    systemUsers: [],
    members: [],
    sermons: [],
    careNotes: [],
    broadcasts: [],
    guestRetention: [],
    auditLogs: [],
    prayerRequests: [],
    pastoralDocuments: [],
    updateCurrentUser: unavailableOperation,
    logout: async () => {
      const response = await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!response.ok) throw new Error('Sign-out failed. Please retry.');
      router.push('/login');router.refresh();
    },
    addUser: unavailableOperation,
    updateUserRole: unavailableOperation,
    addMember: unavailableOperation,
    updateMember: unavailableOperation,
    deleteMember: unavailableOperation,
    addSermon: unavailableOperation,
    toggleLiveSermon: unavailableOperation,
    addCareNote: unavailableOperation,
    sendBroadcast: unavailableOperation,
    updateGuestRetention: unavailableOperation,
    recordAttendance: unavailableOperation,
    addAuditLog: unavailableOperation,
    addPrayerRequest: unavailableOperation,
    incrementPrayerCount: unavailableOperation,
    updatePrayerStatus: unavailableOperation,
    deletePrayerRequest: unavailableOperation,
    addPrayerComment: unavailableOperation,
    addPrayerUpdate: unavailableOperation,
    addPastoralDocument: unavailableOperation,
    updatePastoralDocument: unavailableOperation,
    deletePastoralDocument: unavailableOperation,
    syncOfflineCheckIns: unavailableOperation,
    setIsLive: unavailableOperation,
    // Preserve any legacy offline queue until acknowledged synchronization exists.
    pendingOfflineCount: 0,
    isOnline,
    isLive: false,
    searchQuery,
    setSearchQuery,
  }), [isOnline, searchQuery, initialUser, router]);

  return <ChurchContext.Provider value={value}>{children}</ChurchContext.Provider>;
};

export const useChurch = () => {
  const context = useContext(ChurchContext);
  if (!context) throw new Error('useChurch must be used within a ChurchProvider');
  return context;
};
