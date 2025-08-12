import * as React from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full border rounded px-3 py-2 bg-white dark:bg-neutral-900 ${className}`}
    {...props}
  />
));
Input.displayName = "Input";
