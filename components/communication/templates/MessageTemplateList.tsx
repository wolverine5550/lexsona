import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  Archive,
  Trash2,
  Edit
} from 'lucide-react';
import {
  MessageTemplate,
  MessageTemplateListProps,
  TemplateStatus
} from './types';

const MessageTemplateList = ({
  onTemplateSelect,
  onTemplateDelete,
  onTemplateStatusChange
}: MessageTemplateListProps) => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TemplateStatus | 'all'>(
    'all'
  );
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>(
    'all'
  );

  // Mock data - Replace with actual data fetching
  const templates: MessageTemplate[] = [
    // Add mock templates here for development
  ];

  // Filter templates based on search query and filters
  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' || template.status === statusFilter;
      const matchesCategory =
        selectedCategory === 'all' || template.category.id === selectedCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [templates, searchQuery, statusFilter, selectedCategory]);

  // Template card component
  const TemplateCard = ({ template }: { template: MessageTemplate }) => (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900">{template.title}</h3>
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
        <div className="relative group">
          <button className="p-1 rounded-full hover:bg-gray-100">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
            <div className="py-1">
              <button
                onClick={() => onTemplateSelect(template)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={() =>
                  onTemplateStatusChange(
                    template.id,
                    template.status === 'active' ? 'archived' : 'active'
                  )
                }
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Archive className="w-4 h-4 mr-2" />
                {template.status === 'active' ? 'Archive' : 'Activate'}
              </button>
              <button
                onClick={() => onTemplateDelete(template.id)}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
        {template.content}
      </p>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>Last modified: {template.updatedAt.toLocaleDateString()}</span>
        <span>Used {template.metadata?.useCount || 0} times</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TemplateStatus | 'all')
            }
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No templates found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default MessageTemplateList;
