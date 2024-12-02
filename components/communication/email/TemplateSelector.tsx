import { useState, useMemo } from 'react';
import { Search, FileText } from 'lucide-react';
import { TemplateSelectorProps } from './types';
import { MessageTemplate } from '../templates/types';
import { useQuery } from '@tanstack/react-query';

/**
 * Fetches message templates from the API
 * @returns Promise resolving to array of templates
 */
const fetchTemplates = async (): Promise<MessageTemplate[]> => {
  const response = await fetch('/api/templates');
  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
};

const TemplateSelector = ({
  onTemplateSelect,
  selectedTemplateId,
  disabled = false
}: TemplateSelectorProps) => {
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch templates using React Query
  const {
    data: templates = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['templates'],
    queryFn: fetchTemplates
  });

  /**
   * Filter templates based on search query
   * Memoized to prevent unnecessary recalculations
   */
  const filteredTemplates = useMemo(() => {
    return templates.filter(
      (template) =>
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [templates, searchQuery]);

  /**
   * Handles template selection
   * @param templateId - ID of the selected template
   */
  const handleTemplateSelect = (templateId: string) => {
    if (!disabled) {
      onTemplateSelect(templateId);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-gray-100 rounded-md" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-4 text-red-600">
        Failed to load templates. Please try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={disabled}
          className={`
            w-full pl-10 pr-4 py-2 border rounded-md text-sm
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          `}
        />
      </div>

      {/* Templates List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => handleTemplateSelect(template.id)}
            disabled={disabled}
            className={`
              w-full flex items-start p-3 rounded-md text-left
              ${
                template.id === selectedTemplateId
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200'
              }
              ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}
              border
            `}
          >
            <FileText
              className={`
              w-5 h-5 mr-3 flex-shrink-0 mt-0.5
              ${template.id === selectedTemplateId ? 'text-blue-500' : 'text-gray-400'}
            `}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {template.title}
                </h4>
                {template.isDefault && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    Default
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center text-xs text-gray-500">
                <span className="truncate">
                  Category: {template.category.name}
                </span>
                {template.placeholders.length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded">
                    {template.placeholders.length} variables
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No templates found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateSelector;
