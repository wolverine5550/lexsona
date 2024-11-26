'use client';

import { CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface OnboardingSuccessProps {
  title: string;
  message: string;
  nextStepPath: string;
  nextStepText: string;
  showSkip?: boolean;
}

export function OnboardingSuccess({
  title,
  message,
  nextStepPath,
  nextStepText,
  showSkip = true
}: OnboardingSuccessProps) {
  const router = useRouter();

  // Animation variants for success elements
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.3,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      className="text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Success Icon with Animation */}
      <motion.div
        variants={itemVariants}
        className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10"
      >
        <CheckCircle className="h-8 w-8 text-green-500" />
      </motion.div>

      {/* Success Message */}
      <motion.h2
        variants={itemVariants}
        className="mb-3 text-2xl font-bold text-white"
      >
        {title}
      </motion.h2>
      <motion.p variants={itemVariants} className="mb-8 text-zinc-400">
        {message}
      </motion.p>

      {/* Action Buttons */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:justify-center"
      >
        <Button onClick={() => router.push(nextStepPath)}>
          {nextStepText}
        </Button>
        {showSkip && (
          <Button variant="flat" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>
        )}
      </motion.div>
    </motion.div>
  );
}
