// Template category type definition
export type TemplateCategory = {
  id: string;
  name: string;
  description?: string;
  color?: string;
};

// Template variable/placeholder type
export type TemplatePlaceholder = {
  key: string; // e.g., "{{firstName}}"
  label: string; // e.g., "First Name"
  description?: string; // Help text explaining the variable
  defaultValue?: string;
};

// Template status for workflow management
export type TemplateStatus = 'draft' | 'active' | 'archived';

// Main message template interface
export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: TemplateCategory;
  placeholders: TemplatePlaceholder[];
  status: TemplateStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  isDefault?: boolean;
  metadata?: {
    version?: string;
    tags?: string[];
    useCount?: number;
  };
}

// Props interface for the template list component
export interface MessageTemplateListProps {
  onTemplateSelect: (template: MessageTemplate) => void;
  onTemplateDelete: (templateId: string) => void;
  onTemplateStatusChange: (templateId: string, status: TemplateStatus) => void;
}

// Props interface for the template editor component
export interface MessageTemplateEditorProps {
  template?: MessageTemplate;
  onSave: (
    template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ) => void;
  onCancel: () => void;
  categories: TemplateCategory[];
}

// Props interface for the template preview component
export interface MessageTemplatePreviewProps {
  template: MessageTemplate;
  previewData?: Record<string, string>; // Values for placeholders
}
