import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotesAndAnnotations from '@/components/author/podcasts/NotesAndAnnotations';
import {
  PodcastNoteWithDetails,
  NoteType,
  NotePriority
} from '@/types/podcast';

// Mock data
const createMockNote = (
  overrides: Partial<PodcastNoteWithDetails> = {}
): PodcastNoteWithDetails => ({
  id: '1',
  podcastId: 'pod1',
  authorId: 'auth1',
  type: 'PREPARATION' as NoteType,
  priority: 'HIGH' as NotePriority,
  content: 'Research guest background and previous interviews',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  dueDate: '2024-01-20T10:00:00Z',
  attachments: ['research.pdf'],
  tags: ['prep', 'research'],
  relatedNotes: ['note2'],
  podcast: {
    name: 'Writing Life',
    hostName: 'Jane Smith',
    coverImage: '/images/podcasts/writing-life.jpg'
  },
  ...overrides
});

const mockNotes = [
  createMockNote(),
  createMockNote({
    id: '2',
    type: 'TALKING_POINT' as NoteType,
    priority: 'MEDIUM' as NotePriority,
    content: 'Discuss recent book launch and marketing strategies',
    podcast: {
      name: 'Author Talk',
      hostName: 'John Doe',
      coverImage: '/images/podcasts/author-talk.jpg'
    }
  })
];

describe('NotesAndAnnotations', () => {
  it('renders notes list correctly', () => {
    render(
      <NotesAndAnnotations
        notes={mockNotes}
        onSelectNote={() => {}}
        onCreateNote={() => {}}
      />
    );

    expect(screen.getByText('Writing Life')).toBeInTheDocument();
    expect(screen.getByText('Author Talk')).toBeInTheDocument();
    expect(screen.getByText('Hosted by Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Hosted by John Doe')).toBeInTheDocument();
  });

  it('filters notes by type', () => {
    render(
      <NotesAndAnnotations
        notes={mockNotes}
        onSelectNote={() => {}}
        onCreateNote={() => {}}
      />
    );

    // Select PREPARATION filter
    fireEvent.change(screen.getByDisplayValue('All Types'), {
      target: { value: 'PREPARATION' }
    });

    // Should only show the PREPARATION note
    expect(screen.getByText('Writing Life')).toBeInTheDocument();
    expect(screen.queryByText('Author Talk')).not.toBeInTheDocument();
  });

  it('filters notes by priority', () => {
    render(
      <NotesAndAnnotations
        notes={mockNotes}
        onSelectNote={() => {}}
        onCreateNote={() => {}}
      />
    );

    // Select HIGH priority filter
    fireEvent.change(screen.getByDisplayValue('All Priorities'), {
      target: { value: 'HIGH' }
    });

    // Should only show the HIGH priority note
    expect(screen.getByText('Writing Life')).toBeInTheDocument();
    expect(screen.queryByText('Author Talk')).not.toBeInTheDocument();
  });

  it('sorts notes by date', () => {
    // Create mock notes with different dates
    const sortMockNotes = [
      createMockNote(), // newer date
      createMockNote({
        id: '2',
        createdAt: '2024-01-10T10:00:00Z', // older date
        podcast: {
          name: 'Author Talk',
          hostName: 'John Doe',
          coverImage: '/images/podcasts/author-talk.jpg'
        }
      })
    ];

    render(
      <NotesAndAnnotations
        notes={sortMockNotes}
        onSelectNote={() => {}}
        onCreateNote={() => {}}
      />
    );

    const notes = screen.getAllByRole('heading', { level: 3 });
    expect(notes[0]).toHaveTextContent('Writing Life'); // Most recent first
    expect(notes[1]).toHaveTextContent('Author Talk');
  });

  it('sorts notes by priority when selected', () => {
    // Create mock notes with different priorities
    const sortMockNotes = [
      createMockNote(), // HIGH priority
      createMockNote({
        id: '2',
        priority: 'MEDIUM' as NotePriority,
        podcast: {
          name: 'Author Talk',
          hostName: 'John Doe',
          coverImage: '/images/podcasts/author-talk.jpg'
        }
      })
    ];

    render(
      <NotesAndAnnotations
        notes={sortMockNotes}
        onSelectNote={() => {}}
        onCreateNote={() => {}}
      />
    );

    // Change sort to priority
    fireEvent.change(screen.getByDisplayValue('Sort by Date'), {
      target: { value: 'priority' }
    });

    const notes = screen.getAllByRole('heading', { level: 3 });
    expect(notes[0]).toHaveTextContent('Writing Life'); // HIGH priority first
    expect(notes[1]).toHaveTextContent('Author Talk'); // MEDIUM priority second
  });

  it('filters notes by search query', () => {
    // Create mock notes with different content for testing search
    const searchMockNotes = [
      createMockNote(),
      createMockNote({
        id: '2',
        content: 'Discuss recent book launch and marketing strategies',
        podcast: {
          name: 'Author Talk',
          hostName: 'John Doe',
          coverImage: '/images/podcasts/author-talk.jpg'
        }
      })
    ];

    render(
      <NotesAndAnnotations
        notes={searchMockNotes}
        onSelectNote={() => {}}
        onCreateNote={() => {}}
      />
    );

    // Type into search input
    const searchInput = screen.getByPlaceholderText('Search notes...');
    fireEvent.change(searchInput, { target: { value: 'book launch' } });

    // Verify filtered results
    expect(screen.queryByText('Writing Life')).not.toBeInTheDocument();
    expect(screen.getByText('Author Talk')).toBeInTheDocument();
    expect(
      screen.getByText('Discuss recent book launch and marketing strategies')
    ).toBeInTheDocument();
  });

  it('toggles completed notes visibility', () => {
    // Create mock notes with a completed note
    const notesWithCompleted = [
      createMockNote(),
      createMockNote({
        id: '2',
        type: 'TALKING_POINT' as NoteType,
        priority: 'MEDIUM' as NotePriority,
        content: 'Discuss recent book launch and marketing strategies',
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-10T10:00:00Z',
        completedAt: '2024-01-12T10:00:00Z', // This makes it a completed note
        podcast: {
          name: 'Author Talk',
          hostName: 'John Doe',
          coverImage: '/images/podcasts/author-talk.jpg'
        }
      })
    ];

    render(
      <NotesAndAnnotations
        notes={notesWithCompleted}
        onSelectNote={() => {}}
        onCreateNote={() => {}}
      />
    );

    // Initially, completed notes are hidden
    expect(screen.queryByText('Author Talk')).not.toBeInTheDocument();

    // Show completed notes
    fireEvent.click(screen.getByLabelText(/Show Completed/i));
    expect(screen.getByText('Author Talk')).toBeInTheDocument();
  });

  it('calls onSelectNote when clicking a note', () => {
    const handleSelect = vi.fn();
    render(
      <NotesAndAnnotations
        notes={mockNotes}
        onSelectNote={handleSelect}
        onCreateNote={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Writing Life'));
    expect(handleSelect).toHaveBeenCalledWith(mockNotes[0]);
  });

  it('calls onCreateNote when clicking create button', () => {
    const handleCreate = vi.fn();
    render(
      <NotesAndAnnotations
        notes={mockNotes}
        onSelectNote={() => {}}
        onCreateNote={handleCreate}
      />
    );

    fireEvent.click(screen.getByText('Create Note'));
    expect(handleCreate).toHaveBeenCalled();
  });

  it('displays note metadata correctly', () => {
    render(
      <NotesAndAnnotations
        notes={[createMockNote()]} // Use single note to avoid duplicates
        onSelectNote={() => {}}
        onCreateNote={() => {}}
      />
    );

    // Check dates using specific selectors for the spans
    const updatedText = screen.getByText('Updated Jan 15, 2024', {
      selector: 'span'
    });
    const dueText = screen.getByText('Due Jan 20, 2024', {
      selector: 'span'
    });

    expect(updatedText).toBeInTheDocument();
    expect(dueText).toBeInTheDocument();

    // Check attachments and related notes
    expect(screen.getByText('1 attachments')).toBeInTheDocument();
    expect(screen.getByText('1 related notes')).toBeInTheDocument();
  });

  it('displays tags correctly', () => {
    render(
      <NotesAndAnnotations
        notes={[createMockNote()]} // Use single note to avoid duplicates
        onSelectNote={() => {}}
        onCreateNote={() => {}}
      />
    );

    // Use more specific selector for tags
    const prepTag = screen.getByText('prep', {
      selector: 'span.text-xs'
    });
    const researchTag = screen.getByText('research', {
      selector: 'span.text-xs'
    });

    expect(prepTag).toBeInTheDocument();
    expect(researchTag).toBeInTheDocument();

    // Verify tag styling
    expect(prepTag).toHaveClass('bg-gray-100', 'text-gray-700');
    expect(researchTag).toHaveClass('bg-gray-100', 'text-gray-700');
  });

  it('displays correct type and priority badges', () => {
    render(
      <NotesAndAnnotations
        notes={mockNotes}
        onSelectNote={() => {}}
        onCreateNote={() => {}}
      />
    );

    // Check type badges (using selector to target only the badge spans)
    const prepBadge = screen.getByText('Preparation', {
      selector: 'span.rounded-full'
    });
    const priorityBadge = screen.getByText('High Priority', {
      selector: 'span.rounded-full'
    });

    // Verify badges are present
    expect(prepBadge).toBeInTheDocument();
    expect(priorityBadge).toBeInTheDocument();

    // Verify badge styling
    expect(prepBadge).toHaveClass('bg-blue-50', 'text-blue-700');
    expect(priorityBadge).toHaveClass('bg-red-50', 'text-red-700');

    // Verify badge icons
    expect(prepBadge.querySelector('svg')).toHaveClass('w-4', 'h-4');
    expect(priorityBadge.querySelector('svg')).toHaveClass('w-4', 'h-4');
  });
});
