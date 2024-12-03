import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FAQSearch } from '@/components/help/FAQSearch';

describe('FAQSearch Component', () => {
  const mockFAQData = {
    general: {
      title: 'General Questions',
      items: [
        {
          question: 'What is Lexsona?',
          answer: 'Lexsona is a platform for legal professionals.'
        },
        {
          question: 'How do I get started?',
          answer: 'Sign up for an account and complete your profile.'
        }
      ]
    },
    billing: {
      title: 'Billing & Payments',
      items: [
        {
          question: 'How much does it cost?',
          answer: 'We offer different pricing plans.'
        }
      ]
    }
  };

  // Rendering tests
  describe('Rendering', () => {
    it('should render search input', () => {
      render(<FAQSearch faqData={mockFAQData} />);
      expect(screen.getByPlaceholderText(/search faqs/i)).toBeInTheDocument();
    });

    it('should render all FAQ categories and items initially', () => {
      render(<FAQSearch faqData={mockFAQData} />);

      expect(screen.getByText('General Questions')).toBeInTheDocument();
      expect(screen.getByText('Billing & Payments')).toBeInTheDocument();
      expect(screen.getByText('What is Lexsona?')).toBeInTheDocument();
      expect(screen.getByText('How do I get started?')).toBeInTheDocument();
      expect(screen.getByText('How much does it cost?')).toBeInTheDocument();
    });
  });

  // Search functionality tests
  describe('Search Functionality', () => {
    it('should filter FAQs based on search query', () => {
      render(<FAQSearch faqData={mockFAQData} />);

      const searchInput = screen.getByPlaceholderText(/search faqs/i);
      fireEvent.change(searchInput, { target: { value: 'cost' } });

      // Should show matching FAQ
      expect(screen.getByText('How much does it cost?')).toBeInTheDocument();

      // Should hide non-matching FAQs
      expect(screen.queryByText('What is Lexsona?')).not.toBeInTheDocument();
      expect(
        screen.queryByText('How do I get started?')
      ).not.toBeInTheDocument();
    });

    it('should search in answers as well as questions', () => {
      render(<FAQSearch faqData={mockFAQData} />);

      const searchInput = screen.getByPlaceholderText(/search faqs/i);
      fireEvent.change(searchInput, {
        target: { value: 'legal professionals' }
      });

      expect(screen.getByText('What is Lexsona?')).toBeInTheDocument();
    });

    it('should show no results message when no matches found', () => {
      render(<FAQSearch faqData={mockFAQData} />);

      const searchInput = screen.getByPlaceholderText(/search faqs/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText(/no matching faqs found/i)).toBeInTheDocument();
      expect(
        screen.getByText(/try adjusting your search terms/i)
      ).toBeInTheDocument();
    });

    it('should be case insensitive', () => {
      render(<FAQSearch faqData={mockFAQData} />);

      const searchInput = screen.getByPlaceholderText(/search faqs/i);
      fireEvent.change(searchInput, { target: { value: 'LEXSONA' } });

      expect(screen.getByText('What is Lexsona?')).toBeInTheDocument();
    });
  });

  // Category handling tests
  describe('Category Handling', () => {
    it('should hide empty categories when filtering', () => {
      render(<FAQSearch faqData={mockFAQData} />);

      const searchInput = screen.getByPlaceholderText(/search faqs/i);
      fireEvent.change(searchInput, { target: { value: 'cost' } });

      // Billing category should be visible
      expect(screen.getByText('Billing & Payments')).toBeInTheDocument();

      // General category should be hidden
      expect(screen.queryByText('General Questions')).not.toBeInTheDocument();
    });
  });
});
