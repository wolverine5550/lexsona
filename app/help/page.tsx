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
  }
];

export default function Help() {
  return (
    <section className="min-h-screen pt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-zinc-100">Help & Support</h1>
            <p className="mt-2 text-lg text-zinc-400">
              Get the help you need to succeed with Lexsona. Choose from our
              range of support resources below.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <a
              href="/help/faq"
              className="group relative rounded-2xl bg-zinc-900 p-6 hover:bg-zinc-800/50"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-800 group-hover:bg-zinc-700">
                <svg
                  className="h-6 w-6 text-blue-400 group-hover:text-blue-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-100 group-hover:text-white">
                Frequently Asked Questions
              </h3>
              <p className="mt-2 text-sm text-zinc-400 group-hover:text-zinc-300">
                Find quick answers to common questions about using Lexsona
              </p>
            </a>

            <a
              href="/help/docs"
              className="group relative rounded-2xl bg-zinc-900 p-6 hover:bg-zinc-800/50"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-800 group-hover:bg-zinc-700">
                <svg
                  className="h-6 w-6 text-purple-400 group-hover:text-purple-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-100 group-hover:text-white">
                Documentation
              </h3>
              <p className="mt-2 text-sm text-zinc-400 group-hover:text-zinc-300">
                In-depth guides and technical documentation
              </p>
            </a>

            <a
              href="/help/tickets"
              className="group relative rounded-2xl bg-zinc-900 p-6 hover:bg-zinc-800/50"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-800 group-hover:bg-zinc-700">
                <svg
                  className="h-6 w-6 text-green-400 group-hover:text-green-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-100 group-hover:text-white">
                Support Tickets
              </h3>
              <p className="mt-2 text-sm text-zinc-400 group-hover:text-zinc-300">
                Get personalized help from our support team
              </p>
            </a>

            <a
              href="/help/tutorials"
              className="group relative rounded-2xl bg-zinc-900 p-6 hover:bg-zinc-800/50"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-zinc-800 group-hover:bg-zinc-700">
                <svg
                  className="h-6 w-6 text-orange-400 group-hover:text-orange-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-zinc-100 group-hover:text-white">
                Tutorial Guide
              </h3>
              <p className="mt-2 text-sm text-zinc-400 group-hover:text-zinc-300">
                Learn how to use Lexsona step by step
              </p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
