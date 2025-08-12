export function Skeleton({ className = "h-4 w-full" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 dark:bg-neutral-800 ${className}`}
    />
  );
}
