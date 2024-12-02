import { useMemo } from 'react';
import { MessageTemplatePreviewProps } from './types';

const MessageTemplatePreview = ({
  template,
  previewData = {}
}: MessageTemplatePreviewProps) => {
  // Replace placeholders in content with preview data
  const renderedContent = useMemo(() => {
    let content = template.content;

    // Replace each placeholder with its preview value or keep the placeholder if no value provided
    template.placeholders.forEach((placeholder) => {
      const value =
        previewData[placeholder.key] ||
        placeholder.defaultValue ||
        placeholder.key;
      content = content.replace(new RegExp(placeholder.key, 'g'), value);
    });

    return content;
  }, [template, previewData]);

  return (
    <div className="bg-white rounded-lg border p-6">
      {/* Preview Header */}
      <div className="mb-4 pb-4 border-b">
        <h3 className="text-lg font-medium text-gray-900">Template Preview</h3>
        <p className="text-sm text-gray-500">
          Preview how your template will look with the placeholder values filled
          in.
        </p>
      </div>

      {/* Template Metadata */}
      <div className="mb-4">
        <h4 className="text-base font-medium text-gray-900">
          {template.title}
        </h4>
        <span
          className="inline-block px-2 py-1 text-xs rounded-full mt-2"
          style={{
            backgroundColor: template.category.color + '20',
            color: template.category.color
          }}
        >
          {template.category.name}
        </span>
      </div>

      {/* Preview Content */}
      <div className="prose max-w-none">
        <div
          dangerouslySetInnerHTML={{ __html: renderedContent }}
          className="text-gray-700"
        />
      </div>

      {/* Placeholder Values */}
      {template.placeholders.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Placeholder Values
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {template.placeholders.map((placeholder) => (
              <div
                key={placeholder.key}
                className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
              >
                <span className="text-gray-600">{placeholder.label}:</span>
                <span className="font-medium text-gray-900">
                  {previewData[placeholder.key] ||
                    placeholder.defaultValue ||
                    '(not set)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageTemplatePreview;
