'use client';

import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import { updateEmail } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EmailForm({
  userEmail
}: {
  userEmail: string | undefined;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    // Check if the new email is the same as the old email
    if (e.currentTarget.newEmail.value === userEmail) {
      e.preventDefault();
      setIsSubmitting(false);
      return;
    }
    handleRequest(e, updateEmail, router);
    setIsSubmitting(false);
  };

  return (
    <Card
      title="Your Email"
      description="Please enter the email address you want to use to login."
      footer={
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <p className="text-sm text-zinc-400">
            We will email you to verify the change
          </p>
          <Button
            variant="slim"
            type="submit"
            form="emailForm"
            loading={isSubmitting}
            className="mt-4 w-full sm:mt-0 sm:w-auto"
          >
            Update Email
          </Button>
        </div>
      }
    >
      <div className="mt-6">
        <form id="emailForm" onSubmit={(e) => handleSubmit(e)}>
          <input
            type="email"
            name="newEmail"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            defaultValue={userEmail ?? ''}
            placeholder="Your email"
            maxLength={64}
          />
        </form>
      </div>
    </Card>
  );
}
