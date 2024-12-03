'use client';

import { useState } from 'react';
import { FAQ } from '@/components/ui/FAQ';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  items: FAQItem[];
}

interface FAQData {
  [key: string]: FAQCategory;
}

interface FAQSearchProps {
  faqData: FAQData;
}

export function FAQSearch({ faqData }: FAQSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter FAQ items based on search query
  const filteredFAQs = Object.entries(faqData).reduce<FAQData>(
    (acc, [key, category]) => {
      const filteredItems = category.items.filter(
        (item) =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (filteredItems.length > 0) {
        acc[key] = {
          ...category,
          items: filteredItems
        };
      }

      return acc;
    },
    {}
  );

  return (
    <>
      {/* Search */}
      <div className="mx-auto mt-8 max-w-xl">
        <input
          type="text"
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 text-white placeholder-zinc-500 ring-1 ring-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* FAQ Categories */}
      <div className="mx-auto mt-16 max-w-4xl">
        <div className="grid gap-12">
          {Object.entries(filteredFAQs).map(([key, category]) => (
            <div key={key} className="space-y-8">
              <h2 className="text-2xl font-semibold text-white">
                {category.title}
              </h2>
              <FAQ faqs={category.items} />
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {Object.keys(filteredFAQs).length === 0 && searchQuery && (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-white">
              No matching FAQs found
            </h3>
            <p className="mt-2 text-zinc-400">
              Try adjusting your search terms or browse all categories below
            </p>
          </div>
        )}
      </div>
    </>
  );
}
