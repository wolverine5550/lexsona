/**
 * Skeleton loading component for showing loading states
 * Uses Tailwind's pulse animation for a subtle loading effect
 */
export default function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-800 ${className}`}
      {...props}
    />
  );
}
