import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { EmailDraft } from './types';

interface EmailPreviewProps {
  /**
   * The email draft to preview
   */
  draft: EmailDraft;
  /**
   * Whether the preview modal is open
   */
  isOpen: boolean;
  /**
   * Callback to close the preview modal
   */
  onClose: () => void;
}

/**
 * EmailPreview component
 *
 * Displays a preview of how the email will look when received.
 * Shows the email in a modal dialog with a simulated email client interface.
 */
const EmailPreview: React.FC<EmailPreviewProps> = ({
  draft,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  /**
   * Format the file size for display
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    // Modal backdrop
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      {/* Modal container */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Email Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Email preview container */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Email header section */}
          <div className="space-y-3 border-b pb-4">
            {/* Subject line */}
            <div>
              <span className="font-semibold text-gray-700">Subject: </span>
              <span className="text-gray-900">{draft.subject}</span>
            </div>

            {/* From/To details */}
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-gray-600">From: </span>
                <span className="text-gray-900">
                  {process.env.NEXT_PUBLIC_EMAIL_FROM_ADDRESS}
                </span>
              </div>
              <div>
                <span className="text-gray-600">To: </span>
                <span className="text-gray-900">
                  {draft.recipient_name
                    ? `${draft.recipient_name} <${draft.recipient_email}>`
                    : draft.recipient_email}
                </span>
              </div>
              {draft.scheduled_for && (
                <div>
                  <span className="text-gray-600">Scheduled for: </span>
                  <span className="text-gray-900">
                    {format(new Date(draft.scheduled_for), 'PPpp')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Email content */}
          <div className="prose max-w-none">
            <div
              dangerouslySetInnerHTML={{ __html: draft.content }}
              className="text-gray-900"
            />
          </div>

          {/* Attachments section */}
          {draft.attachments && draft.attachments.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Attachments ({draft.attachments.length})
              </h3>
              <div className="space-y-2">
                {draft.attachments.map((attachment: any) => (
                  <div
                    key={attachment.id}
                    className="flex items-center space-x-3 text-sm p-2 bg-gray-50 rounded-md"
                  >
                    <span className="text-gray-900 font-medium">
                      {attachment.file_name}
                    </span>
                    <span className="text-gray-500">
                      ({formatFileSize(attachment.file_size)})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
