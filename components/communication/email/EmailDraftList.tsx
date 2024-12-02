import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Send,
  Trash2,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { EmailDraft, EmailDraftListProps, EmailStatus } from './types';

const EmailDraftList = ({
  onDraftSelect,
  onDraftDelete,
  onStatusChange
}: EmailDraftListProps) => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<EmailStatus | 'all'>('all');

  // Mock data - Replace with actual data fetching
  const drafts: EmailDraft[] = [
    // Add mock drafts here for development
  ];

  // Filter drafts based on search query and status
  const filteredDrafts = useMemo(() => {
    return drafts.filter((draft) => {
      const matchesSearch =
        draft.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        draft.recipient_email
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        draft.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || draft.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [drafts, searchQuery, statusFilter]);

  // Draft card component
  const DraftCard = ({ draft }: { draft: EmailDraft }) => (
    <div className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h3 className="font-medium text-gray-900">{draft.subject}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>To: {draft.recipient_name || draft.recipient_email}</span>
            {draft.scheduled_for && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(draft.scheduled_for), 'MMM d, yyyy h:mm a')}
              </span>
            )}
          </div>
        </div>
        <div className="relative group">
          <button className="p-1 rounded-full hover:bg-gray-100">
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          <div className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-10">
            <div className="py-1">
              <button
                onClick={() => onDraftSelect(draft)}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              {draft.status === 'draft' && (
                <button
                  onClick={() => onStatusChange(draft.id, 'scheduled')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </button>
              )}
              {(draft.status === 'draft' || draft.status === 'scheduled') && (
                <button
                  onClick={() => onStatusChange(draft.id, 'sent')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Now
                </button>
              )}
              <button
                onClick={() => onDraftDelete(draft.id)}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-4 flex items-center gap-2">
        <span
          className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${
              draft.status === 'draft'
                ? 'bg-gray-100 text-gray-800'
                : draft.status === 'scheduled'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
            }
          `}
        >
          {draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}
        </span>
        {draft.template_id && (
          <span className="text-xs text-gray-500">Using template</span>
        )}
      </div>

      {/* Preview of content */}
      <div className="mt-2">
        <p className="text-sm text-gray-600 line-clamp-2">
          {draft.content.replace(/<[^>]*>/g, '')}{' '}
          {/* Strip HTML tags for preview */}
        </p>
      </div>

      {/* Metadata */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <span>
          Last modified: {format(new Date(draft.updated_at), 'MMM d, yyyy')}
        </span>
        {draft.attachments && draft.attachments.length > 0 && (
          <span>{draft.attachments.length} attachment(s)</span>
        )}
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
            placeholder="Search drafts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as EmailStatus | 'all')
            }
            className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Drafts</option>
            <option value="scheduled">Scheduled</option>
            <option value="sent">Sent</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Drafts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDrafts.map((draft) => (
          <DraftCard key={draft.id} draft={draft} />
        ))}
      </div>

      {/* Empty State */}
      {filteredDrafts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No email drafts found matching your criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default EmailDraftList;
