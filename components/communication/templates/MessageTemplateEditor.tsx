import { useState } from 'react';
import { X, Plus, Save } from 'lucide-react';
import dynamic from 'next/dynamic';
import { MessageTemplateEditorProps, TemplatePlaceholder } from './types';
import type ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues
const QuillEditor = dynamic(
  async () => {
    const { default: QuillComponent } = await import('react-quill');
    return QuillComponent;
  },
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-gray-100 rounded-md" />
  }
);

const MessageTemplateEditor = ({
  template,
  onSave,
  onCancel,
  categories
}: MessageTemplateEditorProps) => {
  // Form state
  const [title, setTitle] = useState(template?.title || '');
  const [content, setContent] = useState(template?.content || '');
  const [selectedCategory, setSelectedCategory] = useState(
    template?.category.id || ''
  );
  const [placeholders, setPlaceholders] = useState<TemplatePlaceholder[]>(
    template?.placeholders || []
  );

  // Rich text editor modules configuration
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

  // Handle placeholder insertion
  const handleAddPlaceholder = () => {
    const newPlaceholder: TemplatePlaceholder = {
      key: `{{placeholder_${placeholders.length + 1}}}`,
      label: `New Placeholder ${placeholders.length + 1}`,
      description: ''
    };
    setPlaceholders([...placeholders, newPlaceholder]);
  };

  const handleRemovePlaceholder = (index: number) => {
    setPlaceholders(placeholders.filter((_, i) => i !== index));
  };

  const handlePlaceholderChange = (
    index: number,
    field: keyof TemplatePlaceholder,
    value: string
  ) => {
    const updatedPlaceholders = [...placeholders];
    updatedPlaceholders[index] = {
      ...updatedPlaceholders[index],
      [field]: value
    };
    setPlaceholders(updatedPlaceholders);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!title.trim() || !content.trim() || !selectedCategory) {
      alert('Please fill in all required fields');
      return;
    }

    // Find selected category object
    const category = categories.find((c) => c.id === selectedCategory);
    if (!category) return;

    onSave({
      title,
      content,
      category,
      placeholders,
      status: template?.status || 'draft',
      createdBy: template?.createdBy || 'current-user-id', // Replace with actual user ID
      lastModifiedBy: 'current-user-id' // Replace with actual user ID
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Input */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-700"
        >
          Template Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          placeholder="Enter template title"
          required
        />
      </div>

      {/* Category Selection */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700"
        >
          Category
        </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          required
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Placeholders Management */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Placeholders
          </label>
          <button
            type="button"
            onClick={handleAddPlaceholder}
            className="inline-flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Placeholder
          </button>
        </div>
        <div className="space-y-2">
          {placeholders.map((placeholder, index) => (
            <div key={index} className="flex gap-2 items-start">
              <input
                type="text"
                value={placeholder.key}
                onChange={(e) =>
                  handlePlaceholderChange(index, 'key', e.target.value)
                }
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Placeholder key"
              />
              <input
                type="text"
                value={placeholder.label}
                onChange={(e) =>
                  handlePlaceholderChange(index, 'label', e.target.value)
                }
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Display label"
              />
              <button
                type="button"
                onClick={() => handleRemovePlaceholder(index)}
                className="p-2 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Rich Text Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Template Content
        </label>
        <div className="prose max-w-none">
          <QuillEditor
            theme="snow"
            value={content}
            onChange={setContent}
            modules={editorModules}
            className="h-64 mb-12" // Extra margin bottom for Quill toolbar
          />
        </div>
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
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Template
        </button>
      </div>
    </form>
  );
};

export default MessageTemplateEditor;
