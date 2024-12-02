import { useState, useRef } from 'react';
import { Paperclip, X, Upload, File } from 'lucide-react';
import { AttachmentManagerProps, FileUploadMeta } from './types';

const AttachmentManager = ({
  attachments,
  onAttachmentAdd,
  onAttachmentRemove,
  disabled = false
}: AttachmentManagerProps) => {
  // Reference to the hidden file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for tracking files currently being uploaded
  const [uploadingFiles, setUploadingFiles] = useState<FileUploadMeta[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Formats the file size into a human-readable string
   * @param bytes - File size in bytes
   * @returns Formatted string (e.g., "1.5 MB")
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  /**
   * Validates a file before upload
   * @param file - File to validate
   * @returns Boolean indicating if file is valid
   */
  const validateFile = (file: File): boolean => {
    // Maximum file size (10MB)
    const maxSize = 10 * 1024 * 1024;

    // Allowed file types (extend as needed)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (file.size > maxSize) {
      setError(`File size exceeds 10MB limit: ${file.name}`);
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      setError(`File type not supported: ${file.name}`);
      return false;
    }

    return true;
  };

  /**
   * Handles the file selection event
   * @param event - File input change event
   */
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setError(null);
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(validateFile);

    if (validFiles.length === 0) {
      // If no valid files, keep the error message displayed
      return;
    }

    // Create upload metadata for each file
    const uploadMeta: FileUploadMeta[] = validFiles.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0
    }));

    setUploadingFiles((prev) => [...prev, ...uploadMeta]);

    try {
      // Process the files for upload
      await onAttachmentAdd(validFiles);

      // Clear the uploading state on success
      setUploadingFiles((prev) =>
        prev.filter(
          (meta) => !validFiles.some((file) => file.name === meta.name)
        )
      );
    } catch (error) {
      console.error('File upload failed:', error);
      setError('Failed to upload one or more files');

      // Remove failed uploads from the uploading state
      setUploadingFiles((prev) =>
        prev.filter(
          (meta) => !validFiles.some((file) => file.name === meta.name)
        )
      );
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Triggers the hidden file input click event
   */
  const handleAddClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* File Input and Add Button */}
      <div className="flex flex-col items-center space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          disabled={disabled}
          aria-label="upload files"
          id="file-upload"
        />

        {/* Drag and drop zone */}
        <div
          className={`
            w-full p-6 border-2 border-dashed rounded-lg
            ${disabled ? 'bg-gray-50 border-gray-300' : 'bg-white border-gray-300 hover:border-blue-500'}
            flex flex-col items-center justify-center space-y-2
            cursor-pointer transition-colors
          `}
          onClick={() => !disabled && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!disabled && e.dataTransfer.files?.length) {
              handleFileSelect({
                target: { files: e.dataTransfer.files }
              } as any);
            }
          }}
          role="button"
          tabIndex={0}
          aria-disabled={disabled}
        >
          <Paperclip className="w-6 h-6 text-gray-400" />
          <p className="text-sm text-gray-600">
            Drag and drop files here or click to upload
          </p>
          <p className="text-xs text-gray-500">
            Supported files: PDF, DOC, DOCX, TXT, JPG, PNG
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          className="text-sm text-red-600 bg-red-50 p-2 rounded-md"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
            >
              <span className="text-sm text-gray-600 truncate">
                {attachment.file_name}
              </span>
              <button
                onClick={() => onAttachmentRemove(attachment.id)}
                className={`text-red-500 hover:text-red-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={`Remove ${attachment.file_name}`}
                disabled={disabled}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttachmentManager;
