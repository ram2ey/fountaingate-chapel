// Rows returned by the Phase 2 schema. Application queries select explicit columns.
export interface ProfileRow { id:string; full_name:string; created_at:Date; updated_at:Date; archived_at:Date|null; }
export interface BranchRow { id:string; name:string; registration_enabled:boolean; created_at:Date; archived_at:Date|null; }
export interface MemberRow { id:string; branch_id:string; profile_id:string|null; household_id:string|null; first_name:string; last_name:string; phone:string|null; email:string|null; dob:string|null; address:string|null; cell_group:string|null; status:'active'|'at_risk'|'first_time_guest'|'inactive'|'transferred'; tags:string[]; created_at:Date; updated_at:Date; archived_at:Date|null; }
export interface ServiceRow { id:string; branch_id:string; name:string; starts_at:Date; ends_at:Date; completed_at:Date|null; attendance_eligible:boolean; created_at:Date; archived_at:Date|null; }
export interface DocumentRow { id:string; branch_id:string; owner_id:string; title:string; confidential:boolean; created_at:Date; updated_at:Date; archived_at:Date|null; }
export interface DocumentVersionRow { id:string; branch_id:string; document_id:string; version:number; storage_key:string; media_type:string; byte_size:string; digest:string; created_at:Date; }
