'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Branch, 
  Member, 
  UserRole, 
  AttendanceLog, 
  CareNote, 
  Sermon, 
  Contribution, 
  Broadcast,
  GuestRetentionItem
} from '../types/church';

import { Language, TranslationDictionary, TRANSLATIONS } from '../translations';

import { 
  DEFAULT_BRANCHES, 
  INITIAL_MEMBERS, 
  INITIAL_SERMONS, 
  INITIAL_CONTRIBUTIONS, 
  INITIAL_CARE_NOTES, 
  INITIAL_BROADCASTS,
  INITIAL_GUEST_RETENTION 
} from '../store/churchStore';

interface ChurchContextType {
  currentBranch: Branch;
  setCurrentBranch: (branch: Branch) => void;
  branches: Branch[];
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  members: Member[];
  addMember: (member: Omit<Member, 'id' | 'consecutive_absences' | 'last_attended_at' | 'first_visited_at'>) => void;
  updateMember: (id: string, updates: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  sermons: Sermon[];
  addSermon: (sermon: Omit<Sermon, 'id' | 'views_count'>) => void;
  toggleLiveSermon: (sermonId: string) => void;
  contributions: Contribution[];
  addContribution: (contribution: Omit<Contribution, 'id'>) => void;
  careNotes: CareNote[];
  addCareNote: (note: Omit<CareNote, 'id' | 'created_at'>) => void;
  broadcasts: Broadcast[];
  sendBroadcast: (broadcast: Omit<Broadcast, 'id' | 'created_at'>) => void;
  guestRetention: GuestRetentionItem[];
  updateGuestRetention: (id: string, updates: Partial<GuestRetentionItem>) => void;
  recordAttendance: (memberIds: string[], eventType: 'Sunday Service' | 'Mid-week Cell' | 'Night Vigil') => void;
  pendingOfflineCount: number;
  syncOfflineCheckIns: () => void;
  isOnline: boolean;
  isLive: boolean;
  setIsLive: (isLive: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentLanguage: Language;
  setCurrentLanguage: (lang: Language) => void;
  t: TranslationDictionary;
}

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

export const ChurchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branches] = useState<Branch[]>(DEFAULT_BRANCHES);
  const [currentBranch, setCurrentBranch] = useState<Branch>(DEFAULT_BRANCHES[0]);
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [sermons, setSermons] = useState<Sermon[]>(INITIAL_SERMONS);
  const [contributions, setContributions] = useState<Contribution[]>(INITIAL_CONTRIBUTIONS);
  const [careNotes, setCareNotes] = useState<CareNote[]>(INITIAL_CARE_NOTES);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(INITIAL_BROADCASTS);
  const [guestRetention, setGuestRetention] = useState<GuestRetentionItem[]>(INITIAL_GUEST_RETENTION);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(0);

  const t = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const updateOnlineStatus = () => {
        const status = navigator.onLine;
        setIsOnline(status);
        if (status) {
          syncOfflineCheckIns();
        }
      };

      window.addEventListener('online', updateOnlineStatus);
      window.addEventListener('offline', updateOnlineStatus);

      // Check localStorage for offline cached records count
      const cached = localStorage.getItem('fgc_kiosk_offline_checkins');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setPendingOfflineCount(parsed.length || 0);
        } catch (e) {}
      }

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
      };
    }
  }, []);

  const syncOfflineCheckIns = () => {
    if (typeof window === 'undefined') return;
    const cached = localStorage.getItem('fgc_kiosk_offline_checkins');
    if (!cached) return;

    try {
      const offlineItems: { memberIds: string[]; eventType: any }[] = JSON.parse(cached);
      if (offlineItems.length > 0) {
        offlineItems.forEach(item => {
          recordAttendance(item.memberIds, item.eventType);
        });
        localStorage.removeItem('fgc_kiosk_offline_checkins');
        setPendingOfflineCount(0);
      }
    } catch (e) {
      console.error('Error syncing offline kiosk records:', e);
    }
  };

  // Filter members when branch changes
  const activeBranchMembers = members.filter(m => currentRole === 'admin' || m.branch_id === currentBranch.id);

  const addMember = (newMemberData: Omit<Member, 'id' | 'consecutive_absences' | 'last_attended_at' | 'first_visited_at'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newMember: Member = {
      ...newMemberData,
      id: `m_${Date.now()}`,
      branch_id: newMemberData.branch_id || currentBranch.id,
      consecutive_absences: 0,
      first_visited_at: today,
      last_attended_at: today,
    };
    setMembers(prev => [newMember, ...prev]);

    if (newMemberData.status === 'first_time_guest') {
      const retentionItem: GuestRetentionItem = {
        id: `gr_${Date.now()}`,
        member_id: newMember.id,
        guest_name: `${newMember.first_name} ${newMember.last_name}`,
        phone: newMember.phone,
        first_visit_date: today,
        day1_welcome_sent: false,
        day3_call_done: false,
        day7_class_invited: false,
        notes: `New visitor added directly to intake pipeline.`
      };
      setGuestRetention(prev => [retentionItem, ...prev]);
    }
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
  };

  const recordAttendance = (memberIds: string[], eventType: 'Sunday Service' | 'Mid-week Cell' | 'Night Vigil') => {
    const today = new Date().toISOString().split('T')[0];
    setMembers(prev => prev.map(m => {
      if (memberIds.includes(m.id)) {
        return {
          ...m,
          last_attended_at: today,
          consecutive_absences: 0,
          status: m.status === 'at_risk' ? 'active' : m.status
        };
      } else {
        // Members not checked in increment consecutive_absences
        const newAbsences = m.consecutive_absences + 1;
        return {
          ...m,
          consecutive_absences: newAbsences,
          status: newAbsences >= 3 && m.status === 'active' ? 'at_risk' : m.status
        };
      }
    }));
  };

  const addSermon = (newSermon: Omit<Sermon, 'id' | 'views_count'>) => {
    const item: Sermon = {
      ...newSermon,
      id: `s_${Date.now()}`,
      views_count: 0,
      branch_id: newSermon.branch_id || currentBranch.id
    };
    setSermons(prev => [item, ...prev]);
  };

  const toggleLiveSermon = (sermonId: string) => {
    setSermons(prev => prev.map(s => {
      if (s.id === sermonId) {
        const nextLiveState = !s.is_live;
        setIsLive(nextLiveState);
        return { ...s, is_live: nextLiveState };
      }
      return { ...s, is_live: false };
    }));
  };

  const addContribution = (newContrib: Omit<Contribution, 'id'>) => {
    const item: Contribution = {
      ...newContrib,
      id: `c_${Date.now()}`,
      branch_id: newContrib.branch_id || currentBranch.id
    };
    setContributions(prev => [item, ...prev]);
  };

  const addCareNote = (newNote: Omit<CareNote, 'id' | 'created_at'>) => {
    const today = new Date().toISOString().split('T')[0];
    const item: CareNote = {
      ...newNote,
      id: `cn_${Date.now()}`,
      created_at: today
    };
    setCareNotes(prev => [item, ...prev]);
  };

  const sendBroadcast = (newBcast: Omit<Broadcast, 'id' | 'created_at'>) => {
    const now = new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    const item: Broadcast = {
      ...newBcast,
      id: `bcast_${Date.now()}`,
      branch_id: newBcast.branch_id || currentBranch.id,
      created_at: now
    };
    setBroadcasts(prev => [item, ...prev]);
  };

  const updateGuestRetention = (id: string, updates: Partial<GuestRetentionItem>) => {
    setGuestRetention(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  return (
    <ChurchContext.Provider
      value={{
        currentBranch,
        setCurrentBranch,
        branches,
        currentRole,
        setCurrentRole,
        members: activeBranchMembers,
        addMember,
        updateMember,
        deleteMember,
        sermons: sermons.filter(s => currentRole === 'admin' || s.branch_id === currentBranch.id),
        addSermon,
        toggleLiveSermon,
        contributions: contributions.filter(c => currentRole === 'admin' || c.branch_id === currentBranch.id),
        addContribution,
        careNotes,
        addCareNote,
        broadcasts: broadcasts.filter(b => currentRole === 'admin' || b.branch_id === currentBranch.id),
        sendBroadcast,
        guestRetention,
        updateGuestRetention,
        recordAttendance,
        pendingOfflineCount,
        syncOfflineCheckIns,
        isOnline,
        isLive,
        setIsLive,
        searchQuery,
        setSearchQuery,
        currentLanguage,
        setCurrentLanguage,
        t
      }}
    >
      {children}
    </ChurchContext.Provider>
  );
};

export const useChurch = () => {
  const context = useContext(ChurchContext);
  if (!context) {
    throw new Error('useChurch must be used within a ChurchProvider');
  }
  return context;
};
