import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ContactHistory from '@/components/author/podcasts/ContactHistory';
import {
  ContactHistoryWithDetails,
  ContactType,
  ContactStatus
} from '@/types/podcast';
import { format } from 'date-fns';

// Mock data
const createMockContact = (
  overrides: Partial<ContactHistoryWithDetails> = {}
): ContactHistoryWithDetails => ({
  id: '1',
  podcastId: 'pod1',
  authorId: 'auth1',
  matchId: 'match1',
  type: 'EMAIL' as ContactType,
  status: 'SENT' as ContactStatus,
  date: '2024-01-15',
  subject: 'Interview Request',
  content: 'I would love to be a guest on your podcast...',
  nextFollowUpDate: '2024-01-22',
  attachments: ['media-kit.pdf'],
  tags: ['follow-up', 'high-priority'],
  podcast: {
    name: 'Writing Life',
    hostName: 'Jane Smith',
    coverImage: '/images/podcasts/writing-life.jpg',
    email: 'jane@writinglife.com'
  },
  ...overrides
});

const mockContacts = [
  createMockContact(),
  createMockContact({
    id: '2',
    type: 'CALL' as ContactType,
    status: 'COMPLETED' as ContactStatus,
    date: '2024-01-10',
    subject: 'Initial Call',
    content: 'Had a great conversation about potential topics...',
    podcast: {
      name: 'Author Talk',
      hostName: 'John Doe',
      coverImage: '/images/podcasts/author-talk.jpg',
      email: 'john@authortalk.com'
    }
  })
];

describe('ContactHistory', () => {
  it('renders contact list correctly', () => {
    render(
      <ContactHistory contacts={mockContacts} onSelectContact={() => {}} />
    );

    expect(screen.getByText('Writing Life')).toBeInTheDocument();
    expect(screen.getByText('Author Talk')).toBeInTheDocument();
    expect(screen.getByText('Hosted by Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Hosted by John Doe')).toBeInTheDocument();
  });

  it('filters contacts by type', () => {
    render(
      <ContactHistory contacts={mockContacts} onSelectContact={() => {}} />
    );

    // Select EMAIL filter
    fireEvent.change(screen.getByDisplayValue('All Types'), {
      target: { value: 'EMAIL' }
    });

    // Should only show the EMAIL contact
    expect(screen.getByText('Writing Life')).toBeInTheDocument();
    expect(screen.queryByText('Author Talk')).not.toBeInTheDocument();
  });

  it('filters contacts by status', () => {
    render(
      <ContactHistory contacts={mockContacts} onSelectContact={() => {}} />
    );

    // Select COMPLETED filter
    fireEvent.change(screen.getByDisplayValue('All Statuses'), {
      target: { value: 'COMPLETED' }
    });

    // Should only show the COMPLETED contact
    expect(screen.queryByText('Writing Life')).not.toBeInTheDocument();
    expect(screen.getByText('Author Talk')).toBeInTheDocument();
  });

  it('sorts contacts by date', () => {
    render(
      <ContactHistory contacts={mockContacts} onSelectContact={() => {}} />
    );

    const contacts = screen.getAllByRole('heading', { level: 3 });
    expect(contacts[0]).toHaveTextContent('Writing Life'); // Most recent first
    expect(contacts[1]).toHaveTextContent('Author Talk');
  });

  it('sorts contacts by status when selected', () => {
    render(
      <ContactHistory contacts={mockContacts} onSelectContact={() => {}} />
    );

    // Change sort to status
    fireEvent.change(screen.getByDisplayValue('Sort by Date'), {
      target: { value: 'status' }
    });

    const contacts = screen.getAllByRole('heading', { level: 3 });
    expect(contacts[0]).toHaveTextContent('Writing Life'); // SENT comes before COMPLETED
    expect(contacts[1]).toHaveTextContent('Author Talk');
  });

  it('filters contacts by search query', () => {
    render(
      <ContactHistory contacts={mockContacts} onSelectContact={() => {}} />
    );

    const searchInput = screen.getByPlaceholderText('Search contacts...');
    fireEvent.change(searchInput, { target: { value: 'writing' } });

    expect(screen.getByText('Writing Life')).toBeInTheDocument();
    expect(screen.queryByText('Author Talk')).not.toBeInTheDocument();
  });

  it('calls onSelectContact when clicking a contact', () => {
    const handleSelect = vi.fn();
    render(
      <ContactHistory contacts={mockContacts} onSelectContact={handleSelect} />
    );

    fireEvent.click(screen.getByText('Writing Life'));
    expect(handleSelect).toHaveBeenCalledWith(mockContacts[0]);
  });

  it('displays contact metadata correctly', () => {
    const mockDate = new Date('2024-01-15');
    const formattedDate = format(mockDate, 'MMM d, yyyy');

    render(
      <ContactHistory contacts={mockContacts} onSelectContact={() => {}} />
    );

    // Check date formatting using the same format as the component
    expect(screen.getByText(formattedDate)).toBeInTheDocument();

    // Check follow-up date - use getAllByText since it appears multiple times
    const followUpDate = format(new Date('2024-01-22'), 'MMM d');
    const followUpTexts = screen.getAllByText(`Follow up: ${followUpDate}`);
    expect(followUpTexts).toHaveLength(2); // One for each contact

    // Check attachments - use getAllByText since it appears multiple times
    const attachmentTexts = screen.getAllByText('1 attachments');
    expect(attachmentTexts).toHaveLength(2); // One for each contact
    expect(attachmentTexts[0]).toBeInTheDocument();
  });

  it('displays tags correctly', () => {
    render(
      <ContactHistory contacts={mockContacts} onSelectContact={() => {}} />
    );

    // Get tags using specific selector for tag spans
    const followUpTags = screen.getAllByText('follow-up', {
      selector: 'span.text-xs'
    });
    const priorityTags = screen.getAllByText('high-priority', {
      selector: 'span.text-xs'
    });

    // Verify we have the correct number of tags
    expect(followUpTags).toHaveLength(2); // One for each contact
    expect(priorityTags).toHaveLength(2); // One for each contact

    // Verify tag styling
    expect(followUpTags[0]).toHaveClass('bg-gray-100', 'text-gray-700');
    expect(priorityTags[0]).toHaveClass('bg-gray-100', 'text-gray-700');

    // Verify tag structure
    const tagIcon = followUpTags[0].querySelector('svg');
    expect(tagIcon).toHaveClass('w-3', 'h-3'); // Check icon size
    expect(tagIcon).toHaveAttribute('stroke', 'currentColor'); // Check icon styling
  });

  it('displays correct type and status badges', () => {
    render(
      <ContactHistory contacts={mockContacts} onSelectContact={() => {}} />
    );

    // Check type badges (using selector to target only the badge spans)
    const emailBadge = screen.getByText('Email', {
      selector: 'span.rounded-full'
    });
    const callBadge = screen.getByText('Call', {
      selector: 'span.rounded-full'
    });

    // Check status badges
    const sentBadge = screen.getByText('Sent', {
      selector: 'span.rounded-full'
    });
    const completedBadge = screen.getByText('Completed', {
      selector: 'span.rounded-full'
    });

    // Verify badges are present
    expect(emailBadge).toBeInTheDocument();
    expect(callBadge).toBeInTheDocument();
    expect(sentBadge).toBeInTheDocument();
    expect(completedBadge).toBeInTheDocument();

    // Verify badge styling
    expect(emailBadge).toHaveClass('bg-blue-50', 'text-blue-700');
    expect(callBadge).toHaveClass('bg-green-50', 'text-green-700');
    expect(sentBadge).toHaveClass('bg-blue-50', 'text-blue-700');
    expect(completedBadge).toHaveClass('bg-green-50', 'text-green-700');
  });

  it('displays subject and content preview', () => {
    render(
      <ContactHistory contacts={mockContacts} onSelectContact={() => {}} />
    );

    expect(screen.getByText('Interview Request')).toBeInTheDocument();
    expect(
      screen.getByText('I would love to be a guest on your podcast...')
    ).toBeInTheDocument();
  });
});
