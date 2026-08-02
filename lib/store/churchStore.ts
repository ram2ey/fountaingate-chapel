import { 
  Member, 
  CareNote, 
  Sermon, 
  Contribution, 
  Broadcast,
  GuestRetentionItem,
  SystemUser,
  AuditLog,
  PrayerRequest,
  PastoralDocument
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

export const INITIAL_PRAYER_REQUESTS: PrayerRequest[] = [
  {
    id: 'pr1',
    requester_name: 'Sister Grace Mensah',
    requester_phone: '+233501987654',
    title: 'Divine Healing & Strength for Mother',
    details: "Standing in faith for total restoration of my mother's health following medical diagnosis in Accra. Believing God for supernatural healing!",
    category: 'Healing & Health',
    is_anonymous: false,
    is_confidential_to_pastors: false,
    is_urgent: true,
    scripture_reference: 'Psalm 103:3',
    status: 'active',
    prayed_count: 48,
    comments: [
      { id: 'c1', author_name: 'Samuel Adjei', text: '🙏 Standing with you in prayer, sister. God heals!', created_at: '2026-07-29' }
    ],
    updates: [],
    created_at: '2026-07-28'
  },
  {
    id: 'pr2',
    requester_name: 'Anonymous Brother',
    requester_phone: '+233244123456',
    title: 'Financial Breakthrough & Business Contract',
    details: "Praying for God's favor upon my pending contract bid in Bolgatanga. Trusting God for kingdom prosperity to support church building project.",
    category: 'Financial Breakthrough',
    is_anonymous: true,
    is_confidential_to_pastors: false,
    is_urgent: false,
    scripture_reference: 'Deuteronomy 8:18',
    status: 'active',
    prayed_count: 32,
    comments: [],
    updates: [
      { id: 'u1', author_name: 'Anonymous Brother', text: 'Praise update: Meeting was rescheduled and went very well today!', created_at: '2026-07-31' }
    ],
    created_at: '2026-07-29'
  },
  {
    id: 'pr3',
    requester_name: 'Deacon Samuel Adjei',
    requester_phone: '+233244123456',
    title: 'Praise Testimony! God Granted My Family Permanent Visa',
    details: 'Glory to God in the highest! The Lord has answered our prayers and granted my entire family our visa approval. Thank you FGC family for interceding!',
    category: 'General Intercession',
    is_anonymous: false,
    is_confidential_to_pastors: false,
    is_urgent: false,
    scripture_reference: undefined,
    status: 'answered_testimony',
    prayed_count: 85,
    comments: [
      { id: 'c2', author_name: 'Kwaku Osei', text: '🎉 To God be the glory! This is amazing news!', created_at: '2026-07-26' },
      { id: 'c3', author_name: 'Pastor Kwame Boateng', text: 'This is a mighty testimony! God is faithful forever.', created_at: '2026-07-26' }
    ],
    updates: [],
    created_at: '2026-07-25'
  },
  {
    id: 'pr4',
    requester_name: 'Confidential Member',
    requester_phone: '+233277334455',
    title: 'Pastoral Guidance for Family Restoration',
    details: 'Seeking urgent pastoral prayer and counsel regarding marital peace and family unity.',
    category: 'Family & Marriage',
    is_anonymous: false,
    is_confidential_to_pastors: true,
    is_urgent: false,
    scripture_reference: 'Ephesians 4:3',
    status: 'under_pastoral_care',
    prayed_count: 12,
    comments: [],
    updates: [],
    created_at: '2026-07-30'
  }
];

export const INITIAL_PASTORAL_DOCUMENTS: PastoralDocument[] = [
  {
    id: 'doc1',
    title: 'Kingdom Dominance Series — Part 4 Presentation Deck.pptx',
    category: 'Sermon Outline',
    file_type: 'pptx',
    file_size: '4.8 MB',
    download_url: '/documents/sermon_slides_part4.pptx',
    content: 'Full 6-slide projection deck for Rev. Eastwood Anaba\'s Sunday message on Kingdom Dominance.',
    slides: [
      {
        slide_number: 1,
        title: 'Kingdom Dominance Series',
        body: 'Part 4: The Anointing for Breakthrough & Domain Expansion\nRev. Eastwood Anaba • Fountain Gate Chapel',
        scripture: 'Isaiah 61:1-3'
      },
      {
        slide_number: 2,
        title: 'Key Scripture Text',
        body: '"The Spirit of the Sovereign LORD is on me, because the LORD has anointed me to proclaim good news to the poor. He has sent me to bind up the brokenhearted..."',
        scripture: 'Isaiah 61:1'
      },
      {
        slide_number: 3,
        title: 'Point 1: The Purpose of the Anointing',
        body: '• The Anointing breaks yokes and removes barriers.\n• Anointing empowers believers for dominion in their careers, business, and family.',
        scripture: 'Luke 4:18-19'
      },
      {
        slide_number: 4,
        title: 'Point 2: Walking in Unshakeable Faith',
        body: '• Faith requires action and confession.\n• Operating by faith and not by sight in difficult times.',
        scripture: 'Hebrews 11:1-6'
      },
      {
        slide_number: 5,
        title: 'Point 3: Kingdom Prosperity & Covenant Giving',
        body: '• Financial stewardship supports global missions and sanctuary expansion.\n• Divine multiplication upon faithful tithers.',
        scripture: 'Deuteronomy 8:18'
      },
      {
        slide_number: 6,
        title: 'Altar Call & Intercession',
        body: '• Praying for total restoration of health, business breakthroughs, and family peace.\n• Stand in faith with Fountain Gate Chapel!',
        scripture: 'Philippians 4:19'
      }
    ],
    created_by_name: 'Rev. Eastwood Anaba',
    last_edited_by_name: 'Rev. Eastwood Anaba',
    last_edited_at: '2026-08-01 04:20 PM',
    created_at: '2026-07-31'
  },
  {
    id: 'doc2',
    title: 'Sunday Sanctuary Service Liturgy & Run of Show.docx',
    category: 'Sunday Service Order',
    file_type: 'docx',
    file_size: '1.2 MB',
    download_url: '/documents/sunday_liturgy.docx',
    content: `FOUNTAIN GATE CHAPEL — SANCTUARY SERVICE ORDER & LITURGY SCRIPT
Date: August 3, 2026

I. OPENING PRAYER & INTERCESSION (08:30 AM – 08:45 AM)
- Intercessory Lead: Deacon Samuel Adjei
- Target Prayer: Sanctuary spiritual atmosphere, visitors, and country.

II. PRAISE & WORSHIP FELLOWSHIP (08:45 AM – 09:15 AM)
- Worship Leader: FGC Sanctuary Choir
- Songs: "Ohene Kese", "You Are Mighty", "Anointing Fall On Me"

III. WELCOME & SANCTUARY ANNOUNCEMENTS (09:15 AM – 09:30 AM)
- Officiating Minister: Pastor Kwame Boateng
- Welcome first-time guests & QR Code Intake Card.

IV. SERMON & ANOINTING EXPOSITION (09:30 AM – 10:30 AM)
- Preacher: Rev. Eastwood Anaba
- Theme: Kingdom Dominance & Supernatural Provision

V. TITHE OFFERING & ALTAR PRAYERS (10:30 AM – 11:00 AM)
- Online MoMo & Card Check-in via FGC Portal

VI. BENEDICTION & RECEPTION
- Dismissal prayer & Pastoral team guest greeting in foyer.`,
    created_by_name: 'Rev. Eastwood Anaba',
    last_edited_by_name: 'Pastor Kwame Boateng',
    last_edited_at: '2026-08-01 10:45 AM',
    created_at: '2026-08-01'
  },
  {
    id: 'doc3',
    title: 'Monthly Pastoral Leadership Meeting Minutes.docx',
    category: 'Pastoral Meeting Agenda',
    file_type: 'docx',
    file_size: '850 KB',
    download_url: '/documents/pastoral_meeting_august.docx',
    content: `FOUNTAIN GATE CHAPEL — PASTORAL LEADERSHIP MEETING
Date: July 30, 2026

ATTENDEES: Rev. Eastwood Anaba, Pastor Kwame Boateng, Pastoral Board

AGENDA ITEMS:
1. Review of Sanctuary Attendance & At-Risk Follow-up:
   - 3 members flagged in At-Risk Intervention Queue. Pastor Kwame assigned to WhatsApp outreach.
2. Online Giving & MoMo Tithe Channel Review:
   - Positive adoption of Online Giving Portal.
3. Community Prayer Wall Expansion:
   - Category filtering & urgent request routing successfully activated.

ACTION ITEMS:
- Complete quarterly leadership retreat planning by August 15.`,
    created_by_name: 'Pastor Kwame Boateng',
    last_edited_by_name: 'Rev. Eastwood Anaba',
    last_edited_at: '2026-07-30 02:15 PM',
    created_at: '2026-07-30'
  }
];


