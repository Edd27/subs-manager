export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning";
}) {
  const styles = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    success:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
    warning:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200",
  }[variant];
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-xs ${styles}`}
    >
      {children}
    </span>
  );
}
