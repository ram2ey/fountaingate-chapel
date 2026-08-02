export type UserRole = 
  | 'admin'
  | 'pastor'
  | 'member';

export type MemberStatus = 
  | 'active'
  | 'at_risk'
  | 'first_time_guest'
  | 'inactive'
  | 'transferred';

export type GivingType = 
  | 'tithe'
  | 'offering'
  | 'building_fund'
  | 'missions'
  | 'special_seed';

export type PaymentMethod = 
  | 'cash'
  | 'pos_card'
  | 'mobile_money'
  | 'bank_transfer'
  | 'online_checkout';

export interface Branch {
  id: string;
  name: string;
  location: string;
  country: string;
  is_main_campus: boolean;
}

export interface Member {
  id: string;
  branch_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone: string;
  dob?: string;
  address?: string;
  cell_group: string;
  status: MemberStatus;
  tags: string[];
  first_visited_at: string;
  last_attended_at: string;
  consecutive_absences: number;
}

export interface AttendanceLog {
  id: string;
  branch_id: string;
  member_id: string;
  member_name: string;
  event_type: 'Sunday Service' | 'Mid-week Cell' | 'Night Vigil';
  event_date: string;
}

export interface CareNote {
  id: string;
  member_id: string;
  member_name: string;
  pastor_id: string;
  pastor_name: string;
  note: string;
  is_confidential: boolean;
  action_item?: string;
  follow_up_date?: string;
  created_at: string;
}

export interface Sermon {
  id: string;
  branch_id: string;
  title: string;
  speaker: string;
  series?: string;
  scripture_reference?: string;
  sermon_date: string;
  facebook_embed_url?: string;
  audio_storage_url?: string;
  is_live: boolean;
  views_count: number;
}

export interface Contribution {
  id: string;
  branch_id: string;
  member_id?: string;
  donor_name: string;
  amount: number;
  currency: string;
  type: GivingType;
  payment_method: PaymentMethod;
  reference_no?: string;
  giving_date: string;
}

export interface Broadcast {
  id: string;
  branch_id?: string;
  channel: 'WhatsApp' | 'SMS';
  target_group: string;
  message: string;
  recipient_count: number;
  sent_by_name: string;
  created_at: string;
}

export interface GuestRetentionItem {
  id: string;
  member_id: string;
  guest_name: string;
  phone: string;
  first_visit_date: string;
  day1_welcome_sent: boolean;
  day3_call_done: boolean;
  day7_class_invited: boolean;
  notes?: string;
}
