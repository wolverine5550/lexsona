'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  faqs: FAQItem[];
}

export function FAQ({ faqs }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-zinc-800">
      {faqs.map((faq, index) => (
        <div key={index} className="py-6">
          {/* Question - with expand/collapse button */}
          <button
            className="flex w-full items-start justify-between text-left"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            <span className="text-lg font-semibold text-white">
              {faq.question}
            </span>
            <span className="ml-6 flex h-7 items-center text-zinc-400">
              <svg
                className={`h-6 w-6 transform transition-transform ${
                  openIndex === index ? 'rotate-45' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m6-6H6"
                />
              </svg>
            </span>
          </button>

          {/* Answer - with animation */}
          <div
            className={`mt-4 overflow-hidden transition-all duration-200 ${
              openIndex === index ? 'max-h-96' : 'max-h-0'
            }`}
          >
            <p className="text-zinc-400">{faq.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
