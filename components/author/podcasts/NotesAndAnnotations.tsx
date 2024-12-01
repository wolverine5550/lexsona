import { useState, useMemo } from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  BookOpen,
  MessageCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronRight,
  Filter,
  Paperclip,
  Tag,
  Calendar,
  Flag,
  Link
} from 'lucide-react';
import {
  PodcastNoteWithDetails,
  NoteType,
  NotePriority
} from '@/types/podcast';

interface NotesAndAnnotationsProps {
  notes: PodcastNoteWithDetails[];
  onSelectNote: (note: PodcastNoteWithDetails) => void;
  onCreateNote: () => void;
}

/**
 * Maps note types to their display properties
 */
const NOTE_TYPE_DISPLAY = {
  PREPARATION: {
    icon: BookOpen,
    label: 'Preparation',
    className: 'bg-blue-50 text-blue-700'
  },
  TALKING_POINT: {
    icon: MessageCircle,
    label: 'Talking Point',
    className: 'bg-purple-50 text-purple-700'
  },
  FOLLOW_UP: {
    icon: Clock,
    label: 'Follow Up',
    className: 'bg-yellow-50 text-yellow-700'
  },
  FEEDBACK: {
    icon: CheckCircle,
    label: 'Feedback',
    className: 'bg-green-50 text-green-700'
  },
  GENERAL: {
    icon: AlertCircle,
    label: 'General',
    className: 'bg-gray-50 text-gray-700'
  }
};

/**
 * Maps priority levels to their display properties
 */
const PRIORITY_DISPLAY = {
  HIGH: {
    icon: Flag,
    label: 'High Priority',
    className: 'bg-red-50 text-red-700'
  },
  MEDIUM: {
    icon: Flag,
    label: 'Medium Priority',
    className: 'bg-yellow-50 text-yellow-700'
  },
  LOW: {
    icon: Flag,
    label: 'Low Priority',
    className: 'bg-green-50 text-green-700'
  }
};

/**
 * Displays and manages notes and annotations for podcast interactions
 * Includes filtering, sorting, and note details
 */
const NotesAndAnnotations = ({
  notes,
  onSelectNote,
  onCreateNote
}: NotesAndAnnotationsProps) => {
  // Filter and sort state
  const [typeFilter, setTypeFilter] = useState<NoteType | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<NotePriority | 'ALL'>(
    'ALL'
  );
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  /**
   * Filters and sorts notes based on current criteria
   */
  const filteredNotes = useMemo(() => {
    let result = [...notes];

    // Filter by completion status
    if (!showCompleted) {
      result = result.filter((note) => !note.completedAt);
    }

    // Apply type filter
    if (typeFilter !== 'ALL') {
      result = result.filter((note) => note.type === typeFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'ALL') {
      result = result.filter((note) => note.priority === priorityFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (note) =>
          note.content.toLowerCase().includes(query) ||
          note.podcast.name.toLowerCase().includes(query) ||
          note.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'date') {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      // Sort by priority
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return (
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });

    return result;
  }, [notes, typeFilter, priorityFilter, sortBy, searchQuery, showCompleted]);

  /**
   * Renders the note type badge with appropriate icon and styling
   */
  const renderTypeBadge = (type: NoteType) => {
    const { icon: Icon, label, className } = NOTE_TYPE_DISPLAY[type];
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
   * Renders the priority badge with appropriate icon and styling
   */
  const renderPriorityBadge = (priority: NotePriority) => {
    const { icon: Icon, label, className } = PRIORITY_DISPLAY[priority];
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
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Notes & Annotations</h2>
        <button
          onClick={onCreateNote}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Note
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div className="flex gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as NoteType | 'ALL')}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="ALL">All Types</option>
            {Object.keys(NOTE_TYPE_DISPLAY).map((type) => (
              <option key={type} value={type}>
                {NOTE_TYPE_DISPLAY[type as NoteType].label}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as NotePriority | 'ALL')
            }
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="ALL">All Priorities</option>
            {Object.keys(PRIORITY_DISPLAY).map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_DISPLAY[priority as NotePriority].label}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'priority')}
            className="rounded-md border border-gray-300 px-3 py-2"
          >
            <option value="date">Sort by Date</option>
            <option value="priority">Sort by Priority</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Show Completed</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 rounded-md border border-gray-300 pl-10 pr-4 py-2"
            />
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            onClick={() => onSelectNote(note)}
            className={`bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer ${
              note.completedAt ? 'opacity-75' : ''
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Podcast Image */}
              <Image
                src={note.podcast.coverImage}
                alt={note.podcast.name}
                width={80}
                height={80}
                className="rounded-md"
              />

              {/* Note Details */}
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {note.podcast.name}
                    </h3>
                    <p className="text-gray-600">
                      Hosted by {note.podcast.hostName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {renderTypeBadge(note.type)}
                    {renderPriorityBadge(note.priority)}
                  </div>
                </div>

                {/* Note Content */}
                <p className="text-gray-700 mt-2 line-clamp-2">
                  {note.content}
                </p>

                {/* Note Metadata */}
                <div className="flex gap-6 mt-2 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Updated {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {note.dueDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        Due {format(new Date(note.dueDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  )}
                  {note.attachments && note.attachments.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Paperclip className="w-4 h-4" />
                      <span>{note.attachments.length} attachments</span>
                    </div>
                  )}
                  {note.relatedNotes && note.relatedNotes.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Link className="w-4 h-4" />
                      <span>{note.relatedNotes.length} related notes</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {note.tags.map((tag, index) => (
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

export default NotesAndAnnotations;
