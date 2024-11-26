'use client';

import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { formatDistanceToNow } from 'date-fns';

interface ResumeProgressProps {
  lastSaved: Date | null;
  onResume: () => void;
  onDiscard: () => void;
}

export function ResumeProgress({
  lastSaved,
  onResume,
  onDiscard
}: ResumeProgressProps) {
  if (!lastSaved) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-blue-500">
            Resume Your Progress
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            You have unsaved progress from{' '}
            {formatDistanceToNow(lastSaved, { addSuffix: true })}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="flat" onClick={onDiscard}>
            Start Fresh
          </Button>
          <Button onClick={onResume}>Resume</Button>
        </div>
      </div>
    </motion.div>
  );
}
