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

export const DEFAULT_BRANCHES: Branch[] = [
  { id: 'b1', name: 'Bolgatanga HQ Campus', location: 'Bolgatanga Main', country: 'Ghana', is_main_campus: true },
  { id: 'b2', name: 'Accra Grace Temple', location: 'East Legon, Accra', country: 'Ghana', is_main_campus: false },
  { id: 'b3', name: 'Tema City Campus', location: 'Community 11, Tema', country: 'Ghana', is_main_campus: false },
  { id: 'b4', name: 'Kumasi Sanctuary', location: 'Ahodwo, Kumasi', country: 'Ghana', is_main_campus: false },
  { id: 'b5', name: 'North London Branch', location: 'Edmonton, London', country: 'United Kingdom', is_main_campus: false },
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'm1',
    branch_id: 'b1',
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
    branch_id: 'b1',
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
    branch_id: 'b1',
    first_name: 'Kwaku',
    last_name: 'Osei',
    email: 'k.osei@gmail.com',
    phone: '+233277334455',
    dob: '1998-02-28',
    address: 'Spintex Road, Accra',
    cell_group: 'Victorious Youth Cell',
    status: 'at_risk',
    tags: ['New Believer', 'Protocol'],
    first_visited_at: '2023-09-01',
    last_attended_at: '2026-06-28',
    consecutive_absences: 4
  },
  {
    id: 'm4',
    branch_id: 'b2',
    first_name: 'Abena',
    last_name: 'Frimpong',
    email: 'abena.f@yahoo.com',
    phone: '+233208889900',
    dob: '1990-09-18',
    address: 'Airport Residential, Accra',
    cell_group: 'Zion Warriors Cell',
    status: 'active',
    tags: ['Prayer Warrior', 'Cell Leader'],
    first_visited_at: '2019-06-20',
    last_attended_at: '2026-07-26',
    consecutive_absences: 0
  },
  {
    id: 'm5',
    branch_id: 'b1',
    first_name: 'Daniel',
    last_name: 'Kpakpo',
    email: 'daniel.guest@gmail.com',
    phone: '+233541112233',
    dob: '2001-04-05',
    address: 'Dansoman, Accra',
    cell_group: 'Unassigned',
    status: 'first_time_guest',
    tags: ['First Time Visitor'],
    first_visited_at: '2026-07-26',
    last_attended_at: '2026-07-26',
    consecutive_absences: 0
  }
];

export const INITIAL_GUEST_RETENTION: GuestRetentionItem[] = [
  {
    id: 'gr1',
    member_id: 'm5',
    guest_name: 'Daniel Kpakpo',
    phone: '+233541112233',
    first_visit_date: '2026-07-26',
    day1_welcome_sent: true,
    day3_call_done: false,
    day7_class_invited: false,
    notes: 'Visited during 1st service. Came with Brother Samuel.'
  }
];

export const INITIAL_SERMONS: Sermon[] = [
  {
    id: 's1',
    branch_id: 'b1',
    title: 'Unlocking Supernatural Breakthroughs',
    speaker: 'Rev. Dr. Eastwood Anaba',
    series: 'Dominion In 2026',
    scripture_reference: 'Isaiah 43:18-19',
    sermon_date: '2026-07-26',
    facebook_embed_url: 'https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Ffacebook%2Fvideos%2F10153231379946729%2F&show_text=false&width=560',
    audio_storage_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    is_live: true,
    views_count: 1420
  },
  {
    id: 's2',
    branch_id: 'b1',
    title: 'Walking In Covenant Blessing & Grace',
    speaker: 'Pastor Joseph Appiah',
    series: 'Covenant Secrets',
    scripture_reference: 'Deuteronomy 28:1-14',
    sermon_date: '2026-07-19',
    facebook_embed_url: 'https://www.facebook.com/plugins/video.php?height=314&href=https%3A%2F%2Fwww.facebook.com%2Ffacebook%2Fvideos%2F10153231379946729%2F&show_text=false&width=560',
    audio_storage_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    is_live: false,
    views_count: 980
  }
];

export const INITIAL_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'c1',
    branch_id: 'b1',
    member_id: 'm1',
    donor_name: 'Samuel Adjei',
    amount: 1500.00,
    currency: 'GHS',
    type: 'tithe',
    payment_method: 'mobile_money',
    reference_no: 'MOMO-994821',
    giving_date: '2026-07-26'
  },
  {
    id: 'c2',
    branch_id: 'b1',
    member_id: 'm4',
    donor_name: 'Abena Frimpong',
    amount: 2500.00,
    currency: 'GHS',
    type: 'building_fund',
    payment_method: 'pos_card',
    reference_no: 'POS-774102',
    giving_date: '2026-07-26'
  },
  {
    id: 'c3',
    branch_id: 'b1',
    donor_name: 'Sunday 1st Service Collection',
    amount: 8450.50,
    currency: 'GHS',
    type: 'offering',
    payment_method: 'cash',
    reference_no: 'CASH-OFFERING-0726',
    giving_date: '2026-07-26'
  }
];

export const INITIAL_CARE_NOTES: CareNote[] = [
  {
    id: 'cn1',
    member_id: 'm2',
    member_name: 'Grace Mensah',
    pastor_id: 'p1',
    pastor_name: 'Pastor Michael Mensah',
    note: 'Visited Grace at home. She recently lost her aunt and has been feeling overwhelmed. Needs pastoral counseling & support.',
    is_confidential: true,
    action_item: 'Follow up with bereavement care package by Friday',
    follow_up_date: '2026-08-04',
    created_at: '2026-07-28'
  },
  {
    id: 'cn2',
    member_id: 'm3',
    member_name: 'Kwaku Osei',
    pastor_id: 'p2',
    pastor_name: 'Care Elder David',
    note: 'Phone conversation. Kwaku started a new job shift on Sundays. Encouraged him to join the Mid-week service or Youth Cell.',
    is_confidential: false,
    action_item: 'Connect Kwaku with Evening Cell Group Leader',
    follow_up_date: '2026-08-05',
    created_at: '2026-07-29'
  }
];

export const INITIAL_BROADCASTS: Broadcast[] = [
  {
    id: 'bcast1',
    branch_id: 'b1',
    channel: 'WhatsApp',
    target_group: 'Cell Leaders & Care Team',
    message: 'Shalom Leaders! Mid-week prayer line opens tomorrow at 6:30 PM. Please send cell report before 5 PM.',
    recipient_count: 34,
    sent_by_name: 'Rev. Dr. Eastwood Anaba',
    created_at: '2026-07-29 14:30'
  },
  {
    id: 'bcast2',
    branch_id: 'b1',
    channel: 'SMS',
    target_group: 'All Ushers & Protocol',
    message: 'Reminder: Briefing meeting for Sunday Thanksgiving Service is on Saturday at 4:00 PM in the Main Sanctuary.',
    recipient_count: 52,
    sent_by_name: 'Protocol Head - Elder John',
    created_at: '2026-07-25 09:15'
  }
];
