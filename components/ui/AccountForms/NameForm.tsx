'use client';

import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import { updateName } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NameForm({ userName }: { userName: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    // Check if the new name is the same as the old name
    if (e.currentTarget.fullName.value === userName) {
      e.preventDefault();
      setIsSubmitting(false);
      return;
    }
    handleRequest(e, updateName, router);
    setIsSubmitting(false);
  };

  return (
    <Card
      title="Your Name"
      description="Please enter your full name, or a display name you are comfortable with."
      footer={
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <p className="text-sm text-zinc-400">64 characters maximum</p>
          <Button
            variant="slim"
            type="submit"
            form="nameForm"
            loading={isSubmitting}
            className="mt-4 w-full sm:mt-0 sm:w-auto"
          >
            Update Name
          </Button>
        </div>
      }
    >
      <div className="mt-6">
        <form id="nameForm" onSubmit={(e) => handleSubmit(e)}>
          <input
            type="text"
            name="fullName"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-zinc-100 placeholder:text-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            defaultValue={userName}
            placeholder="Your name"
            maxLength={64}
          />
        </form>
      </div>
    </Card>
  );
}
