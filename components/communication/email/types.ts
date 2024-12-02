import { Database } from '@/types/supabase';

// Type aliases for better readability
export type EmailDraft = Database['public']['Tables']['email_drafts']['Row'];
export type EmailAttachment =
  Database['public']['Tables']['email_attachments']['Row'];

// Email draft status type
export type EmailStatus = 'draft' | 'scheduled' | 'sent';

// Interface for file upload metadata
export interface FileUploadMeta {
  name: string;
  size: number;
  type: string;
  progress?: number;
}

// Props for the email draft editor component
export interface EmailDraftEditorProps {
  draft?: EmailDraft;
  onSave: (
    draft: Omit<EmailDraft, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<void>;
  onCancel: () => void;
  onSchedule?: (date: Date) => void;
  onSend?: () => void;
}

// Props for the email draft list component
export interface EmailDraftListProps {
  onDraftSelect: (draft: EmailDraft) => void;
  onDraftDelete: (draftId: string) => Promise<void>;
  onStatusChange: (draftId: string, status: EmailStatus) => Promise<void>;
}

// Props for the attachment manager component
export interface AttachmentManagerProps {
  attachments: EmailAttachment[];
  onAttachmentAdd: (files: File[]) => Promise<void>;
  onAttachmentRemove: (attachmentId: string) => Promise<void>;
  disabled?: boolean;
}

// Props for the template selector component
export interface TemplateSelectorProps {
  onTemplateSelect: (templateId: string) => void;
  selectedTemplateId?: string;
  disabled?: boolean;
}

// Props for the scheduling component
export interface SchedulingProps {
  scheduledFor?: string | null;
  onScheduleChange: (date: Date | null) => void;
  disabled?: boolean;
}

// Props for the recipient selector component
export interface RecipientSelectorProps {
  recipientEmail?: string;
  recipientName?: string;
  onRecipientChange: (email: string, name?: string) => void;
  disabled?: boolean;
}
