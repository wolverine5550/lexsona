import Link from 'next/link';
import {
  BookOpen,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  PlayCircle
} from 'lucide-react';

const supportResources = [
  {
    title: 'Frequently Asked Questions',
    description: 'Find quick answers to common questions about using Lexsona',
    icon: <HelpCircle className="h-6 w-6" />,
    href: '/help/faq',
    color: 'text-blue-500'
  },
  {
    title: 'Documentation',
    description: 'In-depth guides and technical documentation',
    icon: <BookOpen className="h-6 w-6" />,
    href: '/help/docs',
    color: 'text-purple-500'
  },
  {
    title: 'Support Tickets',
    description: 'Get personalized help from our support team',
    icon: <LifeBuoy className="h-6 w-6" />,
    href: '/help/tickets',
    color: 'text-green-500'
  },
  {
    title: 'Tutorial Guide',
    description: 'Learn how to use Lexsona step by step',
    icon: <PlayCircle className="h-6 w-6" />,
    href: '/help/tutorial',
    color: 'text-orange-500'
  },
  {
    title: 'Contact Support',
    description: 'Reach out to our team directly',
    icon: <MessageSquare className="h-6 w-6" />,
    href: '/help/contact',
    color: 'text-red-500'
  }
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-zinc-950 py-12">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Help & Support
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-300">
            Get the help you need to succeed with Lexsona. Choose from our range
            of support resources below.
          </p>
        </div>

        {/* Support Resources Grid */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:max-w-4xl lg:grid-cols-2">
          {supportResources.map((resource) => (
            <Link
              key={resource.title}
              href={resource.href}
              className="relative flex flex-col gap-6 rounded-2xl bg-zinc-900 p-6 ring-1 ring-zinc-800 transition-all hover:bg-zinc-800 hover:ring-zinc-700"
            >
              <div className={`${resource.color}`}>{resource.icon}</div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {resource.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-400">
                  {resource.description}
                </p>
              </div>
              <div className="flex items-center text-sm text-zinc-400">
                <span>Learn more</span>
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Help Section */}
        <div className="mx-auto mt-20 max-w-2xl rounded-2xl bg-zinc-900 p-8 ring-1 ring-zinc-800">
          <h2 className="text-xl font-semibold text-white">Need Quick Help?</h2>
          <p className="mt-2 text-zinc-400">
            Search our knowledge base or browse popular topics
          </p>

          {/* Search Bar */}
          <div className="mt-6">
            <input
              type="text"
              placeholder="Search for help..."
              className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-white placeholder-zinc-500 ring-1 ring-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Popular Topics */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-zinc-400">
              Popular Topics
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                'Getting Started',
                'Account Settings',
                'Billing',
                'API Access',
                'Integrations'
              ].map((topic) => (
                <button
                  key={topic}
                  className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-700"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
