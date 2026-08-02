'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Member, 
  UserRole, 
  AttendanceLog, 
  CareNote, 
  Sermon, 
  Contribution, 
  Broadcast,
  GuestRetentionItem,
  SystemUser,
  AuditLog
} from '../types/church';

import { 
  INITIAL_SYSTEM_USERS,
  INITIAL_MEMBERS, 
  INITIAL_SERMONS, 
  INITIAL_CONTRIBUTIONS, 
  INITIAL_CARE_NOTES, 
  INITIAL_BROADCASTS,
  INITIAL_GUEST_RETENTION,
  INITIAL_AUDIT_LOGS
} from '../store/churchStore';

interface ChurchContextType {
  currentUser: SystemUser | null;
  loginWithPhone: (phone: string, pass: string) => boolean;
  logout: () => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
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
  contributions: Contribution[];
  addContribution: (contribution: Omit<Contribution, 'id'>) => void;
  careNotes: CareNote[];
  addCareNote: (note: Omit<CareNote, 'id' | 'created_at'>) => void;
  broadcasts: Broadcast[];
  sendBroadcast: (broadcast: Omit<Broadcast, 'id' | 'created_at'>) => void;
  guestRetention: GuestRetentionItem[];
  updateGuestRetention: (id: string, updates: Partial<GuestRetentionItem>) => void;
  recordAttendance: (memberIds: string[], eventType: 'Sunday Service' | 'Mid-week Cell' | 'Night Vigil') => void;
  auditLogs: AuditLog[];
  addAuditLog: (action: string, details: string) => void;
  pendingOfflineCount: number;
  syncOfflineCheckIns: () => void;
  isOnline: boolean;
  isLive: boolean;
  setIsLive: (isLive: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const ChurchContext = createContext<ChurchContextType | undefined>(undefined);

export const ChurchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(INITIAL_SYSTEM_USERS);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('member');

  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [sermons, setSermons] = useState<Sermon[]>(INITIAL_SERMONS);
  const [contributions, setContributions] = useState<Contribution[]>(INITIAL_CONTRIBUTIONS);
  const [careNotes, setCareNotes] = useState<CareNote[]>(INITIAL_CARE_NOTES);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>(INITIAL_BROADCASTS);
  const [guestRetention, setGuestRetention] = useState<GuestRetentionItem[]>(INITIAL_GUEST_RETENTION);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  const [isOnline, setIsOnline] = useState(true);
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Network Status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      const cached = localStorage.getItem('fgc_kiosk_offline_checkins');
      if (cached) {
        try {
          const list = JSON.parse(cached);
          setPendingOfflineCount(list.length);
        } catch (e) {
          setPendingOfflineCount(0);
        }
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const addAuditLog = (action: string, details: string) => {
    const newLog: AuditLog = {
      id: `al-${Date.now()}`,
      user_phone: currentUser?.phone || 'System',
      user_name: currentUser?.full_name || 'System User',
      action,
      details,
      created_at: new Date().toLocaleString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const loginWithPhone = (phone: string, pass: string): boolean => {
    const cleanInput = phone.replace(/[^0-9]/g, '');
    const user = systemUsers.find(u => u.phone.replace(/[^0-9]/g, '') === cleanInput);
    
    if (user) {
      setCurrentUser(user);
      setCurrentRole(user.role);
      addAuditLog('LOGIN', `User ${user.full_name} signed in with phone ${phone}`);
      return true;
    }

    // Default member sign in
    const newUser: SystemUser = {
      id: `u-${Date.now()}`,
      phone,
      full_name: 'Church Member',
      role: 'member',
      created_at: new Date().toISOString().split('T')[0]
    };
    setCurrentUser(newUser);
    setCurrentRole('member');
    addAuditLog('LOGIN', `Member logged in with phone ${phone}`);
    return true;
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('LOGOUT', `User ${currentUser.full_name} logged out`);
    }
    setCurrentUser(null);
    setCurrentRole('member');
  };

  const addUser = (user: Omit<SystemUser, 'id' | 'created_at'>) => {
    const newUser: SystemUser = {
      ...user,
      id: `u-${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0]
    };
    setSystemUsers(prev => [...prev, newUser]);
    addAuditLog('CREATE_USER', `Added new user ${user.full_name} (${user.role})`);
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setSystemUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    addAuditLog('UPDATE_ROLE', `Updated user role to ${newRole}`);
  };

  const addMember = (newMemberData: Omit<Member, 'id' | 'consecutive_absences' | 'last_attended_at' | 'first_visited_at'>) => {
    const today = new Date().toISOString().split('T')[0];
    const newMember: Member = {
      ...newMemberData,
      id: `m-${Date.now()}`,
      consecutive_absences: 0,
      first_visited_at: today,
      last_attended_at: today
    };

    setMembers(prev => [newMember, ...prev]);

    if (newMember.status === 'first_time_guest') {
      setGuestRetention(prev => [
        {
          id: `gr-${Date.now()}`,
          member_id: newMember.id,
          guest_name: `${newMember.first_name} ${newMember.last_name}`,
          phone: newMember.phone,
          first_visited_at: today,
          stage: 'Intake',
          notes: 'Registered via Connect Card'
        },
        ...prev
      ]);
    }

    addAuditLog('ADD_MEMBER', `Registered member ${newMember.first_name} ${newMember.last_name}`);
  };

  const updateMember = (id: string, updates: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    addAuditLog('UPDATE_MEMBER', `Updated member record`);
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    addAuditLog('DELETE_MEMBER', `Deleted member record`);
  };

  const recordAttendance = (memberIds: string[], eventType: 'Sunday Service' | 'Mid-week Cell' | 'Night Vigil') => {
    const today = new Date().toISOString().split('T')[0];

    if (!isOnline) {
      const cached = localStorage.getItem('fgc_kiosk_offline_checkins') || '[]';
      try {
        const list = JSON.parse(cached);
        list.push({ memberIds, eventType, timestamp: new Date().toISOString() });
        localStorage.setItem('fgc_kiosk_offline_checkins', JSON.stringify(list));
        setPendingOfflineCount(list.length);
      } catch (e) {
        console.error(e);
      }
    }

    setMembers(prev => prev.map(m => {
      if (memberIds.includes(m.id)) {
        return {
          ...m,
          last_attended_at: today,
          consecutive_absences: 0,
          status: m.status === 'at_risk' ? 'active' : m.status
        };
      }
      return m;
    }));

    addAuditLog('ATTENDANCE_CHECKIN', `Recorded ${eventType} for ${memberIds.length} members`);
  };

  const syncOfflineCheckIns = () => {
    const cached = localStorage.getItem('fgc_kiosk_offline_checkins');
    if (!cached) return;

    try {
      const list = JSON.parse(cached);
      list.forEach((item: any) => {
        recordAttendance(item.memberIds, item.eventType);
      });
      localStorage.removeItem('fgc_kiosk_offline_checkins');
      setPendingOfflineCount(0);
      addAuditLog('OFFLINE_SYNC', `Synced ${list.length} offline check-ins`);
    } catch (e) {
      console.error(e);
    }
  };

  const addSermon = (newSermon: Omit<Sermon, 'id' | 'views_count'>) => {
    const sermon: Sermon = {
      ...newSermon,
      id: `s-${Date.now()}`,
      views_count: 0
    };
    setSermons(prev => [sermon, ...prev]);
    addAuditLog('ADD_SERMON', `Uploaded sermon message ${sermon.title}`);
  };

  const toggleLiveSermon = (sermonId: string) => {
    setSermons(prev => prev.map(s => s.id === sermonId ? { ...s, is_live: !s.is_live } : s));
  };

  const addContribution = (newContrib: Omit<Contribution, 'id'>) => {
    const contrib: Contribution = {
      ...newContrib,
      id: `c-${Date.now()}`
    };
    setContributions(prev => [contrib, ...prev]);
    addAuditLog('RECORD_GIVING', `Recorded ${newContrib.type} of GHS ${newContrib.amount}`);
  };

  const addCareNote = (newNote: Omit<CareNote, 'id' | 'created_at'>) => {
    const note: CareNote = {
      ...newNote,
      id: `cn-${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0]
    };
    setCareNotes(prev => [note, ...prev]);
    addAuditLog('CARE_NOTE', `Logged pastoral care note for ${newNote.member_name}`);
  };

  const sendBroadcast = (newBroadcast: Omit<Broadcast, 'id' | 'created_at'>) => {
    const b: Broadcast = {
      ...newBroadcast,
      id: `b-${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0]
    };
    setBroadcasts(prev => [b, ...prev]);
    addAuditLog('SEND_BROADCAST', `Dispatched ${newBroadcast.channel} broadcast to ${newBroadcast.target_group}`);
  };

  const updateGuestRetention = (id: string, updates: Partial<GuestRetentionItem>) => {
    setGuestRetention(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  return (
    <ChurchContext.Provider value={{
      currentUser,
      loginWithPhone,
      logout,
      currentRole,
      setCurrentRole,
      systemUsers,
      addUser,
      updateUserRole,
      members,
      addMember,
      updateMember,
      deleteMember,
      sermons,
      addSermon,
      toggleLiveSermon,
      contributions,
      addContribution,
      careNotes,
      addCareNote,
      broadcasts,
      sendBroadcast,
      guestRetention,
      updateGuestRetention,
      recordAttendance,
      auditLogs,
      addAuditLog,
      pendingOfflineCount,
      syncOfflineCheckIns,
      isOnline,
      isLive,
      setIsLive,
      searchQuery,
      setSearchQuery
    }}>
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
