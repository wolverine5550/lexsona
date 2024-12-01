import { useState, useMemo } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  Mail,
  Phone,
  MessageCircle,
  Video,
  MoreHorizontal,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Filter,
  Paperclip,
  Tag
} from 'lucide-react';
import {
  ContactHistoryWithDetails,
  ContactType,
  ContactStatus
} from '@/types/podcast';

interface ContactHistoryProps {
  contacts: ContactHistoryWithDetails[];
  onSelectContact: (contact: ContactHistoryWithDetails) => void;
}

/**
 * Maps contact types to their display properties
 */
const CONTACT_TYPE_DISPLAY = {
  EMAIL: {
    icon: Mail,
    label: 'Email',
    className: 'bg-blue-50 text-blue-700'
  },
  CALL: {
    icon: Phone,
    label: 'Call',
    className: 'bg-green-50 text-green-700'
  },
  SOCIAL: {
    icon: MessageCircle,
    label: 'Social',
    className: 'bg-purple-50 text-purple-700'
  },
  MEETING: {
    icon: Video,
    label: 'Meeting',
    className: 'bg-yellow-50 text-yellow-700'
  },
  OTHER: {
    icon: MoreHorizontal,
    label: 'Other',
    className: 'bg-gray-50 text-gray-700'
  }
};

/**
 * Maps contact statuses to their display properties
 */
const CONTACT_STATUS_DISPLAY = {
  SENT: {
    icon: Mail,
    label: 'Sent',
    className: 'bg-blue-50 text-blue-700'
  },
  RECEIVED: {
    icon: CheckCircle,
    label: 'Received',
    className: 'bg-green-50 text-green-700'
  },
  NO_REPLY: {
    icon: XCircle,
    label: 'No Reply',
    className: 'bg-red-50 text-red-700'
  },
  SCHEDULED: {
    icon: Calendar,
    label: 'Scheduled',
    className: 'bg-yellow-50 text-yellow-700'
  },
  COMPLETED: {
    icon: CheckCircle,
    label: 'Completed',
    className: 'bg-green-50 text-green-700'
  }
};

/**
 * Displays a historical list of contacts with podcast hosts
 * Includes filtering, sorting, and contact details
 */
const ContactHistory = ({ contacts, onSelectContact }: ContactHistoryProps) => {
  // Filter and sort state
  const [typeFilter, setTypeFilter] = useState<ContactType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'ALL'>(
    'ALL'
  );
  const [sortBy, setSortBy] = useState<'date' | 'status'>('date');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Filters and sorts contacts based on current criteria
   */
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // Apply type filter
    if (typeFilter !== 'ALL') {
      result = result.filter((contact) => contact.type === typeFilter);
    }

    // Apply status filter
    if (statusFilter !== 'ALL') {
      result = result.filter((contact) => contact.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (contact) =>
          contact.podcast.name.toLowerCase().includes(query) ||
          contact.podcast.hostName.toLowerCase().includes(query) ||
          contact.subject?.toLowerCase().includes(query) ||
          contact.content.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      // Sort by status priority
      const statusPriority = {
        SCHEDULED: 0,
        SENT: 1,
        RECEIVED: 2,
        NO_REPLY: 3,
        COMPLETED: 4
      };
      return (
        statusPriority[a.status] - statusPriority[b.status] ||
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });

    return result;
  }, [contacts, typeFilter, statusFilter, sortBy, searchQuery]);

  /**
   * Renders the contact type badge with appropriate icon and styling
   */
  const renderTypeBadge = (type: ContactType) => {
    const { icon: Icon, label, className } = CONTACT_TYPE_DISPLAY[type];
    return (
      <span
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${className}`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </span>
    );
  };

  /**
   * Renders the contact status badge with appropriate icon and styling
   */
  const renderStatusBadge = (status: ContactStatus) => {
    const { icon: Icon, label, className } = CONTACT_STATUS_DISPLAY[status];
    return (
      <span
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${className}`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div className="flex gap-4">
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as ContactType | 'ALL')
            }
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="ALL">All Types</option>
            {Object.keys(CONTACT_TYPE_DISPLAY).map((type) => (
              <option key={type} value={type}>
                {CONTACT_TYPE_DISPLAY[type as ContactType].label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ContactStatus | 'ALL')
            }
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="ALL">All Statuses</option>
            {Object.keys(CONTACT_STATUS_DISPLAY).map((status) => (
              <option key={status} value={status}>
                {CONTACT_STATUS_DISPLAY[status as ContactStatus].label}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'status')}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="date">Sort by Date</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 rounded-md border border-gray-300 pl-10 pr-4 py-2"
          />
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Contact List */}
      <div className="space-y-4">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => onSelectContact(contact)}
            className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start gap-4">
              {/* Podcast Image */}
              <Image
                src={contact.podcast.coverImage}
                alt={contact.podcast.name}
                width={80}
                height={80}
                className="rounded-md"
              />

              {/* Contact Details */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {contact.podcast.name}
                    </h3>
                    <p className="text-gray-600">
                      Hosted by {contact.podcast.hostName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {renderTypeBadge(contact.type)}
                    {renderStatusBadge(contact.status)}
                  </div>
                </div>

                {/* Contact Metadata */}
                <div className="flex gap-6 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(contact.date), 'MMM d, yyyy')}</span>
                  </div>
                  {contact.nextFollowUpDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        Follow up:{' '}
                        {format(new Date(contact.nextFollowUpDate), 'MMM d')}
                      </span>
                    </div>
                  )}
                  {contact.attachments && contact.attachments.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Paperclip className="w-4 h-4" />
                      <span>{contact.attachments.length} attachments</span>
                    </div>
                  )}
                </div>

                {/* Subject and Preview */}
                {contact.subject && (
                  <p className="font-medium mt-2">{contact.subject}</p>
                )}
                <p className="text-gray-600 mt-1 line-clamp-2">
                  {contact.content}
                </p>

                {/* Tags */}
                {contact.tags && contact.tags.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {contact.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContactHistory;
