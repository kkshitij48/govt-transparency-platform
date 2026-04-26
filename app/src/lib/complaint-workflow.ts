import type { ComplaintStatus, UserRole } from '@/types';

// Complaint state machine - allowed transitions per action
export const COMPLAINT_TRANSITIONS: Record<string, {
  nextStatus: ComplaintStatus;
  allowedRoles: UserRole[];
  label: string;
  actionType: string;
  requiresResponse: boolean;
}[]> = {
  Submitted: [
    {
      nextStatus: 'UnderReview',
      allowedRoles: ['Official', 'Admin'],
      label: 'Begin Review',
      actionType: 'InitialReview',
      requiresResponse: true,
    },
    {
      nextStatus: 'Rejected',
      allowedRoles: ['Official', 'Admin'],
      label: 'Reject',
      actionType: 'Reject',
      requiresResponse: true,
    },
  ],
  UnderReview: [
    {
      nextStatus: 'PendingInfo',
      allowedRoles: ['Official', 'Admin'],
      label: 'Request More Info',
      actionType: 'RequestInfo',
      requiresResponse: true,
    },
    {
      nextStatus: 'InProgress',
      allowedRoles: ['Official', 'Admin'],
      label: 'Validate & Begin Work',
      actionType: 'Validate',
      requiresResponse: true,
    },
    {
      nextStatus: 'Rejected',
      allowedRoles: ['Official', 'Admin'],
      label: 'Reject',
      actionType: 'Reject',
      requiresResponse: true,
    },
    {
      nextStatus: 'Escalated',
      allowedRoles: ['Official', 'Admin'],
      label: 'Escalate',
      actionType: 'Escalate',
      requiresResponse: true,
    },
  ],
  PendingInfo: [
    {
      nextStatus: 'UnderReview',
      allowedRoles: ['Citizen', 'Admin'],
      label: 'Submit Additional Info',
      actionType: 'RequestInfo',
      requiresResponse: false,
    },
  ],
  InProgress: [
    {
      nextStatus: 'Resolved',
      allowedRoles: ['Official', 'Admin'],
      label: 'Mark as Resolved',
      actionType: 'Resolve',
      requiresResponse: true,
    },
    {
      nextStatus: 'Escalated',
      allowedRoles: ['Official', 'Admin'],
      label: 'Escalate',
      actionType: 'Escalate',
      requiresResponse: true,
    },
  ],
  Escalated: [
    {
      nextStatus: 'InProgress',
      allowedRoles: ['Admin'],
      label: 'Take Action',
      actionType: 'Validate',
      requiresResponse: true,
    },
    {
      nextStatus: 'Resolved',
      allowedRoles: ['Admin'],
      label: 'Resolve',
      actionType: 'Resolve',
      requiresResponse: true,
    },
  ],
  Resolved: [
    {
      nextStatus: 'Closed',
      allowedRoles: ['Citizen', 'Admin'],
      label: 'Close (Satisfied)',
      actionType: 'Close',
      requiresResponse: false,
    },
    {
      nextStatus: 'Reopened',
      allowedRoles: ['Citizen', 'Admin'],
      label: 'Reopen (Not Satisfied)',
      actionType: 'Reopen',
      requiresResponse: true,
    },
  ],
  Reopened: [
    {
      nextStatus: 'InProgress',
      allowedRoles: ['Official', 'Admin'],
      label: 'Reinvestigate',
      actionType: 'Validate',
      requiresResponse: true,
    },
  ],
  Rejected: [],
  Closed: [],
};

export function getAllowedTransitions(
  currentStatus: ComplaintStatus,
  userRole: UserRole
) {
  const transitions = COMPLAINT_TRANSITIONS[currentStatus] || [];
  return transitions.filter(t => t.allowedRoles.includes(userRole));
}

export const STATUS_CONFIG: Record<ComplaintStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
}> = {
  Submitted: {
    label: 'Submitted',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: '📨',
    description: 'Complaint has been submitted and awaiting review',
  },
  UnderReview: {
    label: 'Under Review',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: '🔍',
    description: 'Official is currently reviewing the complaint',
  },
  PendingInfo: {
    label: 'Pending Information',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    icon: '❓',
    description: 'Additional information required from the citizen',
  },
  InProgress: {
    label: 'In Progress',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: '⚙️',
    description: 'Complaint is validated and being actively worked on',
  },
  Escalated: {
    label: 'Escalated',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: '🚨',
    description: 'Complaint has been escalated to higher authority',
  },
  Resolved: {
    label: 'Resolved',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: '✅',
    description: 'Complaint has been resolved by the department',
  },
  Reopened: {
    label: 'Reopened',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    icon: '🔄',
    description: 'Complaint has been reopened for reinvestigation',
  },
  Rejected: {
    label: 'Rejected',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    icon: '❌',
    description: 'Complaint was found to be invalid and rejected',
  },
  Closed: {
    label: 'Closed',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    icon: '🔒',
    description: 'Complaint has been closed and citizen is satisfied',
  },
};

export const COMPLAINT_CATEGORIES = [
  'Infrastructure & Roads',
  'Public Health Services',
  'Education Services',
  'Financial Services',
  'Environmental Issues',
  'Public Safety',
  'Utility Services',
  'Social Services',
  'Corruption & Misconduct',
  'Administrative Delays',
  'Other',
];

export const ORDERED_STATUSES: ComplaintStatus[] = [
  'Submitted',
  'UnderReview',
  'PendingInfo',
  'InProgress',
  'Escalated',
  'Resolved',
  'Closed',
];
