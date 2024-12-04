import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import Button from '@/components/ui/Button';
import Image from 'next/image';
import {
  BookOpen,
  Podcast,
  Target,
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  Star
} from 'lucide-react';
import { FAQ } from '@/components/ui/FAQ';

// Updated features data with 6 items
const features = [
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: 'Author Profiles',
    description:
      'Create a professional profile showcasing your books and expertise'
  },
  {
    icon: <Podcast className="h-6 w-6" />,
    title: 'Podcast Matching',
    description:
      "Get matched with podcasts that align with your book's audience"
  },
  {
    icon: <Target className="h-6 w-6" />,
    title: 'Smart Targeting',
    description: 'Find podcasts based on genre, audience size, and engagement'
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: 'Pitch Templates',
    description: 'Use proven templates to craft compelling podcast pitches'
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: 'Analytics',
    description: 'Track your outreach success and podcast appearances'
  },
  {
    icon: <Calendar className="h-6 w-6" />,
    title: 'Schedule Manager',
    description: 'Manage your podcast interview calendar efficiently'
  }
];

// Benefits data with alternating layout information
const benefits = [
  {
    title: "Expand Your Book's Reach",
    description:
      "Connect with podcast audiences actively seeking new books and authors. Our smart matching system finds shows where your book's message will resonate most.",
    buttonText: 'Start Matching',
    imageSide: 'right',
    // Placeholder gradient - we can replace with actual image later
    imageComponent: (
      <div className="relative h-full w-full min-h-[400px]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl" />
      </div>
    )
  },
  {
    title: 'Craft Perfect Pitches',
    description:
      'Use our proven templates and AI-powered tools to create personalized podcast pitches that get responses. Stand out from the crowd with data-driven insights.',
    buttonText: 'See Templates',
    imageSide: 'left',
    imageComponent: (
      <div className="relative h-full w-full min-h-[400px]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl" />
      </div>
    )
  },
  {
    title: 'Track Your Success',
    description:
      'Monitor your podcast outreach campaign with detailed analytics. See which approaches work best and optimize your strategy for maximum impact.',
    buttonText: 'View Analytics',
    imageSide: 'right',
    imageComponent: (
      <div className="relative h-full w-full min-h-[400px]">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-blue-500/20 rounded-2xl" />
      </div>
    )
  }
];

// Testimonial data with author information and quotes
const testimonials = [
  {
    quote:
      "Lexsona helped me find the perfect podcasts for my book. I've reached thousands of new readers through these interviews.",
    author: 'Sarah Mitchell',
    role: "Author of 'Digital Mindfulness'",
    // We can replace with actual avatar images later
    avatarComponent: (
      <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 flex items-center justify-center text-2xl">
        SM
      </div>
    )
  },
  {
    quote:
      'The pitch templates and analytics tools made it so easy to track my podcast outreach. My book launch was a huge success.',
    author: 'David Chen',
    role: 'Bestselling Business Author',
    avatarComponent: (
      <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-2xl">
        DC
      </div>
    )
  },
  {
    quote:
      'I was skeptical at first, but the podcast matches were spot-on. The ROI on my subscription has been incredible.',
    author: 'Rachel Kumar',
    role: 'Self-Development Coach & Author',
    avatarComponent: (
      <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-pink-500/30 to-blue-500/30 flex items-center justify-center text-2xl">
        RK
      </div>
    )
  }
];

// FAQ data with questions and answers
const faqs = [
  {
    question: "How does Lexsona's podcast matching work?",
    answer:
      "Our AI-powered system analyzes your book's genre, target audience, and key topics, then matches you with podcasts that have similar audience demographics and content preferences. We consider factors like podcast reach, engagement rates, and past guest success."
  },
  {
    question: "What's included in the pitch templates?",
    answer:
      'Our pitch templates are data-driven frameworks that include customizable sections for your book overview, target audience alignment, potential interview topics, and your unique value proposition. Each template is optimized based on successful pitches that led to bookings.'
  },
  {
    question: 'How long does it take to see results?',
    answer:
      'Most authors start receiving podcast responses within 2-3 weeks of sending their first pitches. Success rates vary based on factors like genre, timing, and pitch quality. Our analytics dashboard helps you track and optimize your outreach strategy.'
  },
  {
    question: 'Can I track my podcast appearances?',
    answer:
      "Yes! Our platform includes a comprehensive tracking system for managing your podcast outreach and appearances. Track pitch responses, schedule interviews, and measure the impact of each appearance on your book's visibility."
  },
  {
    question: 'Do you guarantee podcast bookings?',
    answer:
      "While we can't guarantee specific bookings, our matching algorithm and pitch templates significantly increase your chances of success. Authors using Lexsona typically secure 3-5 podcast appearances within their first month."
  }
];

export default async function HomePage() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  // If user is signed in, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section - Updated styling */}
      <section className="relative px-6 lg:px-8 py-24 md:py-32 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Text */}
            <div className="text-center lg:text-left space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                Connect Authors with{' '}
                <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  Perfect Podcasts
                </span>
              </h1>
              <p className="text-lg md:text-xl leading-8 text-zinc-300">
                Find and pitch to podcasts that match your book's audience.
                Expand your reach and connect with engaged listeners.
              </p>
              <div className="flex gap-x-6 justify-center lg:justify-start">
                <Link
                  href="/signup"
                  className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  Get Started
                </Link>
                <Link
                  href="#features"
                  className="text-sm font-semibold leading-6 text-white"
                >
                  Learn more <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            {/* Right Column - Image */}
            <div className="relative aspect-square lg:aspect-auto lg:h-[600px] rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20" />
              <div className="absolute inset-0 backdrop-blur-3xl" />
              <div className="absolute inset-0 bg-zinc-950/50" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section - Updated styling */}
      <section className="py-24 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Everything You Need to Succeed
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Comprehensive tools and features to help authors connect with the
              right podcast audiences
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-lg hover:shadow-zinc-950/50"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 text-blue-500">
                  {feature.icon}
                </div>
                <h3 className="mb-3 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-zinc-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - Updated styling */}
      <section className="py-24 bg-gradient-to-b from-zinc-950 to-zinc-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`mb-32 last:mb-0 grid gap-12 items-center ${
                benefit.imageSide === 'right'
                  ? 'lg:grid-cols-[6fr_5fr]'
                  : 'lg:grid-cols-[5fr_6fr]'
              }`}
            >
              <div
                className={`space-y-6 ${
                  benefit.imageSide === 'right' ? 'order-1' : 'order-2'
                }`}
              >
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  {benefit.title}
                </h2>
                <p className="text-lg leading-8 text-zinc-300">
                  {benefit.description}
                </p>
                <div>
                  <Button size="lg">{benefit.buttonText}</Button>
                </div>
              </div>

              <div
                className={`relative ${
                  benefit.imageSide === 'right' ? 'order-2' : 'order-1'
                }`}
              >
                {benefit.imageComponent}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section - Updated styling */}
      <section className="py-24 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Trusted by Authors Worldwide
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              See how authors are using Lexsona to expand their reach and
              connect with engaged podcast audiences.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="relative rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-8 transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-lg hover:shadow-zinc-950/50"
              >
                <div className="absolute top-4 right-6 text-4xl text-zinc-700/50">
                  "
                </div>
                <div className="mb-8">{testimonial.avatarComponent}</div>
                <blockquote className="text-lg font-medium text-zinc-200 mb-6">
                  "{testimonial.quote}"
                </blockquote>
                <div className="text-center">
                  <div className="font-semibold text-white">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-zinc-400">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-zinc-900">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Find answers to common questions about using Lexsona for your
              podcast outreach
            </p>
          </div>

          {/* FAQ Component */}
          <FAQ faqs={faqs} />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Content Container */}
          <div className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-800/25 to-zinc-800/5 px-6 py-24 shadow-2xl sm:px-24 xl:py-32">
            {/* Gradient Blur Effects */}
            <div className="absolute -top-32 left-0 h-96 w-96 opacity-20 blur-3xl">
              <div className="h-full w-full bg-gradient-to-br from-blue-500 to-purple-500" />
            </div>
            <div className="absolute -bottom-32 right-0 h-96 w-96 opacity-20 blur-3xl">
              <div className="h-full w-full bg-gradient-to-br from-purple-500 to-blue-500" />
            </div>

            {/* Content */}
            <div className="mx-auto max-w-2xl text-center">
              {/* Main Heading */}
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to Grow Your Book's Audience?
              </h2>

              {/* Subtext */}
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-zinc-300">
                Join authors who are reaching new readers through podcast
                interviews. Start your podcast outreach journey today.
              </p>

              {/* Action Buttons */}
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Button>Get Started Now</Button>
                <Button variant="flat" className="group">
                  View Pricing
                  <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Button>
              </div>

              {/* Social Proof */}
              <p className="mt-10 text-sm text-zinc-400">
                Trusted by 1,000+ authors • 30-day free trial • No credit card
                required
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
