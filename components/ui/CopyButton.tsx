'use client';

import { useState } from 'react';

interface CopyButtonProps {
  value: string;
  label: string;
  successMessage?: string;
}

export function CopyButton({
  value,
  label,
  successMessage = 'Copied!'
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-sm text-blue-600 hover:text-blue-800"
      aria-label={label}
    >
      {copied ? successMessage : 'Copy'}
    </button>
  );
}
