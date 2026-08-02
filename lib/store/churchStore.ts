import { 
  Member, 
  CareNote, 
  Sermon, 
  Contribution, 
  Broadcast,
  GuestRetentionItem,
  SystemUser,
  AuditLog
} from '../types/church';

export const INITIAL_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'u1',
    phone: '+233244000111',
    full_name: 'Rev. Eastwood Anaba',
    email: 'eastwood@fgc.org',
    role: 'admin',
    created_at: '2026-01-01'
  },
  {
    id: 'u2',
    phone: '+233501987654',
    full_name: 'Pastor Kwame Boateng',
    email: 'k.boateng@fgc.org',
    role: 'pastor',
    created_at: '2026-01-15'
  },
  {
    id: 'u3',
    phone: '+233277334455',
    full_name: 'Grace Mensah',
    email: 'grace.m@gmail.com',
    role: 'member',
    created_at: '2026-02-01'
  }
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm1',
    first_name: 'Samuel',
    last_name: 'Adjei',
    email: 'samuel.adjei@fgc.org',
    phone: '+233244123456',
    dob: '1985-05-14',
    address: 'Block 4, Bolga Central',
    cell_group: 'Zion Warriors Cell',
    status: 'active',
    tags: ['Deacon', 'Usher', 'Tither'],
    first_visited_at: '2018-01-10',
    last_attended_at: '2026-07-26',
    consecutive_absences: 0
  },
  {
    id: 'm2',
    first_name: 'Grace',
    last_name: 'Mensah',
    email: 'grace.m@fgc.org',
    phone: '+233501987654',
    dob: '1992-11-03',
    address: 'Estate House 12, Accra',
    cell_group: 'Grace & Truth Cell',
    status: 'at_risk',
    tags: ['Choir', 'Youth Leader'],
    first_visited_at: '2021-03-15',
    last_attended_at: '2026-07-05',
    consecutive_absences: 3
  },
  {
    id: 'm3',
    first_name: 'Kwaku',
    last_name: 'Osei',
    email: 'k.osei@gmail.com',
    phone: '+233277334455',
    dob: '1990-08-22',
    address: 'Ahodwo, Kumasi',
    cell_group: 'Anointing & Power Cell',
    status: 'active',
    tags: ['Media Team'],
    first_visited_at: '2023-05-20',
    last_attended_at: '2026-07-26',
    consecutive_absences: 0
  },
  {
    id: 'm4',
    first_name: 'Abena',
    last_name: 'Kwarteng',
    email: 'abena.k@yahoo.com',
    phone: '+233244998877',
    dob: '1995-12-01',
    address: 'Community 11, Tema',
    cell_group: 'Shalom Family Cell',
    status: 'first_time_guest',
    tags: ['First Time Visitor'],
    first_visited_at: '2026-07-26',
    last_attended_at: '2026-07-26',
    consecutive_absences: 0
  }
];

export const INITIAL_SERMONS: Sermon[] = [
  {
    id: 's1',
    title: 'The Anointing for Breakthrough & Domain Expansion',
    speaker: 'Rev. Eastwood Anaba',
    series: 'Kingdom Dominance Series',
    scripture_reference: 'Isaiah 61:1-3',
    sermon_date: '2026-07-26',
    facebook_embed_url: 'https://facebook.com/eastwoodanabaministries/videos/123456789',
    audio_storage_url: 'https://storage.supabase.co/sermons/anointing_breakthrough.mp3',
    is_live: false,
    views_count: 3420
  },
  {
    id: 's2',
    title: 'Walking in Unshakeable Faith & Supernatural Provision',
    speaker: 'Rev. Eastwood Anaba',
    series: 'Faith Unshaken',
    scripture_reference: 'Hebrews 11:1-6',
    sermon_date: '2026-07-19',
    facebook_embed_url: 'https://facebook.com/eastwoodanabaministries/videos/987654321',
    audio_storage_url: 'https://storage.supabase.co/sermons/supernatural_faith.mp3',
    is_live: false,
    views_count: 2890
  }
];

export const INITIAL_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'c1',
    member_id: 'm1',
    donor_name: 'Samuel Adjei',
    amount: 1500,
    currency: 'GHS',
    type: 'tithe',
    payment_method: 'mobile_money',
    reference_no: 'MOMO-9928172',
    giving_date: '2026-07-26'
  },
  {
    id: 'c2',
    member_id: 'm3',
    donor_name: 'Kwaku Osei',
    amount: 500,
    currency: 'GHS',
    type: 'building_fund',
    payment_method: 'pos_card',
    reference_no: 'POS-883921',
    giving_date: '2026-07-26'
  },
  {
    id: 'c3',
    donor_name: 'Anonymous Sanctuary Visitor',
    amount: 250,
    currency: 'GHS',
    type: 'offering',
    payment_method: 'cash',
    reference_no: 'CASH-001',
    giving_date: '2026-07-26'
  }
];

export const INITIAL_CARE_NOTES: CareNote[] = [
  {
    id: 'cn1',
    member_id: 'm2',
    member_name: 'Grace Mensah',
    pastor_id: 'u1',
    pastor_name: 'Rev. Eastwood Anaba',
    note: 'Member missed 3 consecutive Sunday services. Called on WhatsApp; she noted traveling for family matters. Promised to return next Sunday.',
    is_confidential: true,
    action_item: 'Follow up via SMS on Friday evening before Sunday service.',
    created_at: '2026-07-20'
  }
];

export const INITIAL_BROADCASTS: Broadcast[] = [
  {
    id: 'b1',
    channel: 'WhatsApp',
    target_group: 'All Active Members',
    message: 'Shalom Beloved, join us this Sunday for anointing service at Fountain Gate Chapel. Service starts at 8:30 AM.',
    recipient_count: 420,
    sent_by_name: 'Rev. Eastwood Anaba',
    created_at: '2026-07-25'
  }
];

export const INITIAL_GUEST_RETENTION: GuestRetentionItem[] = [
  {
    id: 'gr1',
    member_id: 'm4',
    guest_name: 'Abena Kwarteng',
    phone: '+233244998877',
    first_visited_at: '2026-07-26',
    stage: 'Intake',
    notes: 'Visited via QR Code Guest Intake form. Expressed interest in Youth Choir.'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'al1',
    user_phone: '+233244000111',
    user_name: 'Rev. Eastwood Anaba',
    action: 'LOGIN',
    details: 'User logged in via Phone Number + Password',
    created_at: '2026-08-01 08:30:00'
  },
  {
    id: 'al2',
    user_phone: '+233244000111',
    user_name: 'Rev. Eastwood Anaba',
    action: 'UPDATE_ROLE',
    details: 'Promoted Pastor Kwame Boateng to Pastor role',
    created_at: '2026-08-01 09:15:20'
  }
];
