import Link from 'next/link';
import Logo from '@/components/icons/Logo';

export default function Footer() {
  return (
    <footer className="mx-auto max-w-[1920px] px-6 bg-zinc-900">
      <div className="grid grid-cols-1 gap-8 py-12 text-white transition-colors duration-150 border-b lg:grid-cols-12 border-zinc-600 bg-zinc-900">
        <div className="col-span-1 lg:col-span-4">
          <Link
            href="/"
            className="flex items-center flex-initial font-bold md:mr-24"
          >
            <span className="mr-2 border rounded-full border-zinc-700">
              <Logo />
            </span>
            <span>Lexsona</span>
          </Link>
          <p className="mt-4 text-sm text-zinc-400">
            Empowering authors to connect with their audience through podcast
            appearances.
          </p>
        </div>
        <div className="col-span-1 lg:col-span-2">
          <h3 className="font-bold text-white mb-4">Product</h3>
          <ul className="space-y-3">
            <li>
              <Link
                href="/features"
                className="text-zinc-400 hover:text-white transition duration-150"
              >
                Features
              </Link>
            </li>
            <li>
              <Link
                href="/pricing"
                className="text-zinc-400 hover:text-white transition duration-150"
              >
                Pricing
              </Link>
            </li>
            <li>
              <Link
                href="/help"
                className="text-zinc-400 hover:text-white transition duration-150"
              >
                Support
              </Link>
            </li>
          </ul>
        </div>
        <div className="col-span-1 lg:col-span-2">
          <h3 className="font-bold text-white mb-4">Resources</h3>
          <ul className="space-y-3">
            <li>
              <Link
                href="/blog"
                className="text-zinc-400 hover:text-white transition duration-150"
              >
                Blog
              </Link>
            </li>
            <li>
              <Link
                href="/guides"
                className="text-zinc-400 hover:text-white transition duration-150"
              >
                Author Guides
              </Link>
            </li>
            <li>
              <Link
                href="/success-stories"
                className="text-zinc-400 hover:text-white transition duration-150"
              >
                Success Stories
              </Link>
            </li>
          </ul>
        </div>
        <div className="col-span-1 lg:col-span-2">
          <h3 className="font-bold text-white mb-4">Legal</h3>
          <ul className="space-y-3">
            <li>
              <Link
                href="/privacy"
                className="text-zinc-400 hover:text-white transition duration-150"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="text-zinc-400 hover:text-white transition duration-150"
              >
                Terms of Service
              </Link>
            </li>
          </ul>
        </div>
        <div className="col-span-1 lg:col-span-2">
          <h3 className="font-bold text-white mb-4">Contact</h3>
          <ul className="space-y-3">
            <li>
              <a
                href="mailto:support@lexsona.com"
                className="text-zinc-400 hover:text-white transition duration-150"
              >
                support@lexsona.com
              </a>
            </li>
            <li>
              <Link
                href="/help/tickets"
                className="text-zinc-400 hover:text-white transition duration-150"
              >
                Submit a Ticket
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="py-8 text-center text-sm text-zinc-400">
        <p>&copy; {new Date().getFullYear()} Lexsona. All rights reserved.</p>
      </div>
    </footer>
  );
}
