import { FAQSearch } from '@/components/help/FAQSearch';

// FAQ data organized by categories
const faqData = {
  general: {
    title: 'General',
    items: [
      {
        question: "How does Lexsona's podcast matching work?",
        answer:
          "Our AI-powered system analyzes your book's genre, target audience, and key topics, then matches you with podcasts that have similar audience demographics and content preferences. We consider factors like podcast reach, engagement rates, and past guest success."
      },
      {
        question: 'What are the requirements to use Lexsona?',
        answer:
          'To use Lexsona, you need to be a published author with at least one book available for sale. This can include traditionally published books, self-published books, or upcoming releases with a confirmed publication date.'
      },
      {
        question: 'Is there a free trial available?',
        answer:
          'Yes! We offer a 30-day free trial that gives you access to all features. No credit card is required to start your trial.'
      }
    ]
  },
  pitching: {
    title: 'Podcast Pitching',
    items: [
      {
        question: "What's included in the pitch templates?",
        answer:
          'Our pitch templates are data-driven frameworks that include customizable sections for your book overview, target audience alignment, potential interview topics, and your unique value proposition. Each template is optimized based on successful pitches that led to bookings.'
      },
      {
        question: 'How many podcasts can I pitch to?',
        answer:
          'The number of pitches you can send depends on your subscription plan. Basic plans include 20 pitches per month, while premium plans offer unlimited pitches.'
      },
      {
        question: 'Can I customize the pitch templates?',
        answer:
          'Yes, all pitch templates are fully customizable. We provide the framework and suggested content, but you can modify any section to better match your voice and style.'
      }
    ]
  },
  tracking: {
    title: 'Analytics & Tracking',
    items: [
      {
        question: 'How do I track my podcast appearances?',
        answer:
          "Our platform includes a comprehensive tracking system for managing your podcast outreach and appearances. You can track pitch responses, schedule interviews, and measure the impact of each appearance on your book's visibility."
      },
      {
        question: 'What analytics are available?',
        answer:
          'We provide detailed analytics including response rates, booking success rates, audience reach metrics, and engagement statistics. You can also track trends over time and compare performance across different podcast categories.'
      },
      {
        question: 'Can I export my analytics data?',
        answer:
          'Yes, all analytics data can be exported in various formats including CSV and PDF. This makes it easy to share reports with your team or include in your marketing materials.'
      }
    ]
  },
  account: {
    title: 'Account & Billing',
    items: [
      {
        question: 'How do I change my subscription plan?',
        answer:
          'You can change your subscription plan at any time from your account settings. Changes take effect at the start of your next billing cycle.'
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. Enterprise customers can also pay by invoice.'
      },
      {
        question: 'How do I cancel my subscription?',
        answer:
          'You can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period.'
      }
    ]
  }
};

export default function FAQPage() {
  return (
    <section className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-zinc-100">
              Frequently Asked Questions
            </h1>
            <p className="mt-2 text-lg text-zinc-400">
              Find answers to common questions about using Lexsona. Can't find
              what you're looking for? Our support team is here to help.
            </p>
          </div>

          {/* FAQ Search Component */}
          <FAQSearch faqData={faqData} />

          {/* Contact Support */}
          <div className="mt-20 text-center">
            <h2 className="text-xl font-semibold text-zinc-100">
              Still have questions?
            </h2>
            <p className="mt-2 text-zinc-400">
              Create a support ticket and our team will assist you promptly.
            </p>
            <div className="mt-6">
              <a
                href="/help#create-ticket"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Create Support Ticket
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
