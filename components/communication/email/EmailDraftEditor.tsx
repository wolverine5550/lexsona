import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Save, Send, Clock } from 'lucide-react';
import { EmailDraft, EmailDraftEditorProps, EmailAttachment } from './types';
import { Database } from '@/types/supabase';
import RecipientSelector from './RecipientSelector';
import AttachmentManager from './AttachmentManager';
import TemplateSelector from './TemplateSelector';
import Scheduling from './Scheduling';
import {
  notifySuccess,
  notifyError,
  notifyLoading,
  dismissToast
} from '@/lib/utils/notifications';
import debounce from 'lodash/debounce';
import EmailPreview from './EmailPreview';

// Type for draft form data
type DraftFormData = Omit<EmailDraft, 'id' | 'created_at' | 'updated_at'>;

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import('react-quill');
    return RQ;
  },
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded-md" />
  }
);
import 'react-quill/dist/quill.snow.css';

const EmailDraftEditor = ({
  draft,
  onSave,
  onCancel,
  onSchedule,
  onSend
}: EmailDraftEditorProps) => {
  // Form state
  const [subject, setSubject] = useState(draft?.subject || '');
  const [content, setContent] = useState(draft?.content || '');
  const [recipientEmail, setRecipientEmail] = useState(
    draft?.recipient_email || ''
  );
  const [recipientName, setRecipientName] = useState(
    draft?.recipient_name || ''
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    draft?.template_id || ''
  );
  const [scheduledFor, setScheduledFor] = useState(
    draft?.scheduled_for || null
  );
  const [attachments, setAttachments] = useState<EmailAttachment[]>(
    (draft?.attachments as EmailAttachment[]) || []
  );
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [autosaveError, setAutosaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Track form changes
  useEffect(() => {
    const hasChanges =
      subject !== (draft?.subject || '') ||
      content !== (draft?.content || '') ||
      recipientEmail !== (draft?.recipient_email || '') ||
      recipientName !== (draft?.recipient_name || '') ||
      selectedTemplateId !== (draft?.template_id || '') ||
      scheduledFor !== (draft?.scheduled_for || null) ||
      JSON.stringify(attachments) !== JSON.stringify(draft?.attachments || []);

    setIsDirty(hasChanges);
  }, [
    subject,
    content,
    recipientEmail,
    recipientName,
    selectedTemplateId,
    scheduledFor,
    attachments,
    draft
  ]);

  // Rich text editor configuration
  const editorModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ color: [] }, { background: [] }],
      ['link'],
      ['clean']
    ]
  };

  // Handle recipient changes
  const handleRecipientChange = (email: string, name?: string) => {
    setRecipientEmail(email);
    setRecipientName(name || '');
  };

  // Handle template selection
  const handleTemplateSelect = async (templateId: string) => {
    const loadingToast = notifyLoading('Loading template...');
    setSelectedTemplateId(templateId);

    try {
      const response = await fetch(`/api/templates/${templateId}`);
      if (!response.ok) throw new Error('Failed to fetch template');

      const template = await response.json();
      setContent(template.content);
      // Optionally update subject if template has a default subject
      if (template.metadata?.defaultSubject) {
        setSubject(template.metadata.defaultSubject);
      }
      dismissToast(loadingToast);
      notifySuccess('Template loaded successfully');
    } catch (error) {
      console.error('Error fetching template:', error);
      dismissToast(loadingToast);
      notifyError('Failed to load template. Please try again.');
    }
  };

  // Handle file upload
  const handleFileUpload = async (files: File[]) => {
    const loadingToast = notifyLoading('Uploading files...');
    try {
      const uploadPromises = files.map(async (file) => {
        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', file);

        // Upload to Supabase Storage
        const response = await fetch('/api/uploads', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();

        // Create attachment record
        const attachment: EmailAttachment = {
          id: data.id,
          email_id: draft?.id || '',
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: data.path,
          created_at: new Date().toISOString(),
          created_by: 'current-user-id' // TODO: Replace with actual user ID
        };

        return attachment;
      });

      const newAttachments = await Promise.all(uploadPromises);
      setAttachments((prev) => [...prev, ...newAttachments]);
      dismissToast(loadingToast);
      notifySuccess(`Successfully uploaded ${files.length} file(s)`);
    } catch (error) {
      console.error('File upload failed:', error);
      dismissToast(loadingToast);
      notifyError('Failed to upload files. Please try again.');
    }
  };

  // Handle attachment removal
  const handleAttachmentRemove = async (attachmentId: string) => {
    const loadingToast = notifyLoading('Removing attachment...');
    try {
      // Delete from storage
      await fetch(`/api/uploads/${attachmentId}`, {
        method: 'DELETE'
      });

      // Update state
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      dismissToast(loadingToast);
      notifySuccess('Attachment removed successfully');
    } catch (error) {
      console.error('Failed to remove attachment:', error);
      dismissToast(loadingToast);
      notifyError('Failed to remove attachment. Please try again.');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!subject.trim() || !content.trim() || !recipientEmail.trim()) {
      notifyError('Please fill in all required fields');
      return;
    }

    const loadingToast = notifyLoading('Saving draft...');
    try {
      // Prepare draft data
      const draftData: DraftFormData = {
        subject,
        content,
        recipient_email: recipientEmail,
        recipient_name: recipientName || null,
        template_id: selectedTemplateId || null,
        scheduled_for: scheduledFor,
        status: scheduledFor ? 'scheduled' : 'draft',
        created_by: draft?.created_by || 'current-user-id', // TODO: Replace with actual user ID
        last_modified_by: 'current-user-id', // TODO: Replace with actual user ID
        metadata: draft?.metadata || null,
        attachments: attachments as any[] // Cast to match the expected type
      };

      await onSave(draftData);
      dismissToast(loadingToast);
      notifySuccess('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
      dismissToast(loadingToast);
      notifyError('Failed to save draft. Please try again.');
    }
  };

  // Enhanced debounced save function with error recovery
  const debouncedSave = useCallback(
    debounce(async (draftData: DraftFormData) => {
      try {
        setIsAutosaving(true);
        setAutosaveError(null);
        await onSave(draftData);
        setLastSavedAt(new Date());
        setIsAutosaving(false);
      } catch (error) {
        console.error('Autosave failed:', error);
        setAutosaveError(
          'Failed to autosave. Changes will be saved when connection is restored.'
        );
        setIsAutosaving(false);

        // Retry autosave after 30 seconds
        setTimeout(() => {
          if (isDirty) {
            debouncedSave(draftData);
          }
        }, 30000);
      }
    }, 2000),
    []
  );

  // Manual save function
  const handleManualSave = async () => {
    if (!isDirty) return;

    setIsSaving(true);
    const loadingToast = notifyLoading('Saving changes...');

    try {
      const draftData: DraftFormData = {
        subject,
        content,
        recipient_email: recipientEmail,
        recipient_name: recipientName || null,
        template_id: selectedTemplateId || null,
        scheduled_for: scheduledFor,
        status: scheduledFor ? 'scheduled' : 'draft',
        created_by: draft?.created_by || 'current-user-id',
        last_modified_by: 'current-user-id',
        metadata: draft?.metadata || null,
        attachments: attachments as any[]
      };

      await onSave(draftData);
      setLastSavedAt(new Date());
      setAutosaveError(null);
      dismissToast(loadingToast);
      notifySuccess('Changes saved successfully');
    } catch (error) {
      console.error('Manual save failed:', error);
      dismissToast(loadingToast);
      notifyError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Enhanced last saved time display
  const getLastSavedText = () => {
    if (isAutosaving) return 'Saving...';
    if (isSaving) return 'Saving changes...';
    if (autosaveError) return autosaveError;
    if (!lastSavedAt) return 'Not saved yet';

    const now = new Date();
    const diff = now.getTime() - lastSavedAt.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 30) return 'Saved just now';
    if (seconds < 60) return 'Saved less than a minute ago';
    if (minutes === 1) return 'Saved 1 minute ago';
    if (minutes < 60) return `Saved ${minutes} minutes ago`;
    if (hours === 1) return 'Saved 1 hour ago';
    return `Saved ${hours} hours ago`;
  };

  // Add handleSend function before the return statement
  const handleSend = async () => {
    // Validate required fields
    if (!subject.trim() || !content.trim() || !recipientEmail.trim()) {
      notifyError('Please fill in all required fields before sending');
      return;
    }

    // Save any unsaved changes first
    if (isDirty) {
      const saveLoadingToast = notifyLoading(
        'Saving changes before sending...'
      );
      try {
        const draftData: DraftFormData = {
          subject,
          content,
          recipient_email: recipientEmail,
          recipient_name: recipientName || null,
          template_id: selectedTemplateId || null,
          scheduled_for: scheduledFor,
          status: 'draft',
          created_by: draft?.created_by || 'current-user-id',
          last_modified_by: 'current-user-id',
          metadata: draft?.metadata || null,
          attachments: attachments as any[]
        };

        await onSave(draftData);
        dismissToast(saveLoadingToast);
      } catch (error) {
        dismissToast(saveLoadingToast);
        notifyError('Failed to save changes before sending');
        return;
      }
    }

    // Send the email
    const sendLoadingToast = notifyLoading('Sending email...');
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          draftId: draft?.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      dismissToast(sendLoadingToast);
      notifySuccess('Email sent successfully');

      // Call the onSend callback if provided
      if (onSend) {
        onSend();
      }
    } catch (error) {
      console.error('Send email error:', error);
      dismissToast(sendLoadingToast);
      notifyError('Failed to send email. Please try again.');
    }
  };

  // Create a preview draft with current form data
  const getPreviewDraft = (): EmailDraft => ({
    id: draft?.id || '',
    subject,
    content,
    recipient_email: recipientEmail,
    recipient_name: recipientName || null,
    template_id: selectedTemplateId || null,
    scheduled_for: scheduledFor,
    status: scheduledFor ? 'scheduled' : 'draft',
    created_by: draft?.created_by || 'current-user-id',
    last_modified_by: 'current-user-id',
    created_at: draft?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metadata: draft?.metadata || null,
    attachments: attachments
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status bar */}
      <div className="flex items-center justify-between text-sm bg-gray-50 px-4 py-2 rounded-md">
        <div className="flex items-center space-x-2">
          <Save
            className={`h-4 w-4 ${isAutosaving || isSaving ? 'animate-pulse text-blue-500' : 'text-gray-500'}`}
          />
          <span
            className={
              autosaveError
                ? 'text-amber-600'
                : isAutosaving || isSaving
                  ? 'text-blue-600'
                  : 'text-gray-600'
            }
          >
            {getLastSavedText()}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {/* Preview button */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            disabled={!subject && !content}
            className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Preview
          </button>
          {/* Manual save button */}
          <button
            type="button"
            onClick={handleManualSave}
            disabled={!isDirty || isAutosaving || isSaving}
            className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-md text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save now
          </button>
          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft?.id || isAutosaving || isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4 mr-2" />
            Send
          </button>
        </div>
      </div>

      {/* Subject Line */}
      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-medium text-gray-700"
        >
          Subject
        </label>
        <input
          type="text"
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter email subject"
          required
        />
      </div>

      {/* Recipient Selection */}
      <RecipientSelector
        recipientEmail={recipientEmail}
        recipientName={recipientName}
        onRecipientChange={handleRecipientChange}
      />

      {/* Template Selection */}
      <div className="border rounded-md p-4 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Use Template (Optional)
        </h3>
        <TemplateSelector
          onTemplateSelect={handleTemplateSelect}
          selectedTemplateId={selectedTemplateId}
        />
      </div>

      {/* Rich Text Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Content
        </label>
        <div className="prose max-w-none">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={editorModules}
            className="h-64 mb-12" // Extra margin for toolbar
          />
        </div>
      </div>

      {/* Attachments */}
      <AttachmentManager
        attachments={attachments}
        onAttachmentAdd={handleFileUpload}
        onAttachmentRemove={handleAttachmentRemove}
      />

      {/* Scheduling */}
      <div className="border rounded-md p-4 bg-gray-50">
        <Scheduling
          scheduledFor={scheduledFor}
          onScheduleChange={(date) => {
            setScheduledFor(date?.toISOString() || null);
            if (date && onSchedule) {
              onSchedule(date);
            }
          }}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border rounded-md"
        >
          Cancel
        </button>
        {onSend && (
          <button
            type="button"
            onClick={onSend}
            className="inline-flex items-center px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md"
          >
            <Send className="w-4 h-4 mr-2" />
            Send Now
          </button>
        )}
        <button
          type="submit"
          disabled={!isDirty}
          className={`
            inline-flex items-center px-4 py-2 text-sm text-white rounded-md
            ${
              isDirty
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-400 cursor-not-allowed'
            }
          `}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Draft
        </button>
      </div>

      {/* Preview Modal */}
      <EmailPreview
        draft={getPreviewDraft()}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </form>
  );
};

export default EmailDraftEditor;
