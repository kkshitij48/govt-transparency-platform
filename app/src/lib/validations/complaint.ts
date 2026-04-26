import { z } from 'zod';

export const complaintSchema = z.object({
  description: z
    .string()
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
  department_id: z.string().uuid('Please select a valid department'),
  category: z.string().optional(),
  priority: z.enum(['Low', 'Normal', 'High', 'Critical']).default('Normal'),
  is_anonymous: z.boolean().default(false),
});

export const responseSchema = z.object({
  response_text: z
    .string()
    .min(20, 'Response must be at least 20 characters')
    .max(5000, 'Response cannot exceed 5000 characters'),
  action_type: z.enum([
    'InitialReview',
    'RequestInfo',
    'Validate',
    'Reject',
    'Resolve',
    'Escalate',
    'Close',
    'Reopen',
  ]),
});

export const additionalInfoSchema = z.object({
  additional_info: z
    .string()
    .min(20, 'Additional information must be at least 20 characters')
    .max(3000, 'Additional information cannot exceed 3000 characters'),
});

export type ComplaintInput = z.infer<typeof complaintSchema>;
export type ResponseInput = z.infer<typeof responseSchema>;
export type AdditionalInfoInput = z.infer<typeof additionalInfoSchema>;
