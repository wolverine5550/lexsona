import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus } from 'lucide-react';
import {
  MessageTemplate,
  TemplateCategory,
  TemplateStatus
} from '@/components/communication/templates/types';
import MessageTemplateList from '@/components/communication/templates/MessageTemplateList';
import MessageTemplateEditor from '@/components/communication/templates/MessageTemplateEditor';
import MessageTemplatePreview from '@/components/communication/templates/MessageTemplatePreview';

// API functions
const fetchTemplates = async (): Promise<MessageTemplate[]> => {
  const response = await fetch('/api/templates');
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
};

const fetchCategories = async (): Promise<TemplateCategory[]> => {
  const response = await fetch('/api/templates/categories');
  if (!response.ok) throw new Error('Failed to fetch categories');
  return response.json();
};

const createTemplate = async (
  template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const response = await fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template)
  });
  if (!response.ok) throw new Error('Failed to create template');
  return response.json();
};

const updateTemplate = async (template: MessageTemplate) => {
  const response = await fetch(`/api/templates/${template.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template)
  });
  if (!response.ok) throw new Error('Failed to update template');
  return response.json();
};

const deleteTemplate = async (templateId: string) => {
  const response = await fetch(`/api/templates/${templateId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete template');
  return response.json();
};

const updateTemplateStatus = async ({
  templateId,
  status
}: {
  templateId: string;
  status: TemplateStatus;
}) => {
  const response = await fetch(`/api/templates/${templateId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (!response.ok) throw new Error('Failed to update template status');
  return response.json();
};

const MessageTemplatesPage = () => {
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] =
    useState<MessageTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  // Queries
  const {
    data: templates,
    isLoading: templatesLoading,
    error: templatesError
  } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['template-categories'],
    queryFn: fetchCategories
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsEditing(false);
      setSelectedTemplate(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: updateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setIsEditing(false);
      setSelectedTemplate(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  const statusMutation = useMutation({
    mutationFn: updateTemplateStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    }
  });

  // Event handlers
  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(true);
    // Reset preview data based on template placeholders
    const initialPreviewData: Record<string, string> = {};
    template.placeholders.forEach((p) => {
      initialPreviewData[p.key] = p.defaultValue || '';
    });
    setPreviewData(initialPreviewData);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsEditing(true);
    setPreviewData({});
  };

  const handleSave = async (
    template: Omit<MessageTemplate, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (selectedTemplate) {
      await updateMutation.mutateAsync({
        ...template,
        id: selectedTemplate.id,
        createdAt: selectedTemplate.createdAt,
        updatedAt: new Date()
      });
    } else {
      await createMutation.mutateAsync(template);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteMutation.mutateAsync(templateId);
    }
  };

  const handleStatusChange = async (
    templateId: string,
    status: TemplateStatus
  ) => {
    await statusMutation.mutateAsync({ templateId, status });
  };

  if (templatesError) {
    return (
      <div className="p-8 text-center text-red-600">
        Error loading templates. Please try again later.
      </div>
    );
  }

  if (templatesLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Message Templates
        </h1>
        <button
          onClick={handleCreateNew}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          disabled={isEditing}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* List and Editor Column */}
        <div className="space-y-6">
          {isEditing ? (
            <MessageTemplateEditor
              template={selectedTemplate || undefined}
              categories={categories || []}
              onSave={handleSave}
              onCancel={() => {
                setIsEditing(false);
                setSelectedTemplate(null);
              }}
            />
          ) : (
            <MessageTemplateList
              onTemplateSelect={handleTemplateSelect}
              onTemplateDelete={handleDelete}
              onTemplateStatusChange={handleStatusChange}
            />
          )}
        </div>

        {/* Preview Column */}
        {selectedTemplate && (
          <div className="lg:sticky lg:top-6">
            <MessageTemplatePreview
              template={selectedTemplate}
              previewData={previewData}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageTemplatesPage;
