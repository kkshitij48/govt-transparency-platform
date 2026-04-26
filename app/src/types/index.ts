export type UserRole = 'Citizen' | 'Official' | 'Admin';

export type ComplaintStatus =
  | 'Submitted'
  | 'UnderReview'
  | 'PendingInfo'
  | 'InProgress'
  | 'Escalated'
  | 'Resolved'
  | 'Reopened'
  | 'Rejected'
  | 'Closed';

export type ProjectStatus = 'Planning' | 'Active' | 'Completed' | 'OnHold' | 'Cancelled';

export interface User {
  user_id: string;
  name: string;
  email: string;
  role: UserRole;
  department_id?: string;
  created_at: string;
}

export interface Department {
  department_id: string;
  department_name: string;
  description?: string;
  created_at: string;
}

export interface Project {
  project_id: string;
  project_name: string;
  status: ProjectStatus;
  start_date: string;
  end_date?: string;
  description?: string;
  budget?: number;
  department_id: string;
  department?: Department;
  created_at: string;
}

export interface Complaint {
  complaint_id: string;
  description: string;
  status: ComplaintStatus;
  created_date: string;
  updated_at: string;
  user_id: string;
  department_id: string;
  citizen?: User;
  department?: Department;
  response?: Response;
}

export interface Response {
  response_id: string;
  response_text: string;
  response_date: string;
  complaint_id: string;
  official_id: string;
  official?: User;
  action_type?: string;
}

export interface ComplaintTimeline {
  id: string;
  complaint_id: string;
  status: ComplaintStatus;
  note: string;
  created_by: string;
  created_at: string;
  actor?: User;
}

export interface AnalyticsData {
  total_complaints: number;
  resolved_complaints: number;
  pending_complaints: number;
  escalated_complaints: number;
  avg_resolution_days: number;
  complaints_by_status: { status: string; count: number }[];
  complaints_by_department: { department: string; count: number }[];
  monthly_trend: { month: string; count: number }[];
}
