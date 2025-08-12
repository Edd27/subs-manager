import * as React from "react";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border bg-white dark:bg-neutral-900 ${className}`}
    >
      {children}
    </div>
  );
}
export function CardHeader({
  children,
  className = "p-4 border-b",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
export function CardTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-base font-medium">{children}</div>;
}
export function CardContent({
  children,
  className = "p-4",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
