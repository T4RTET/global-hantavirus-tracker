import * as React from "react";
import { cn } from "@/lib/utils";

const tones = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "text-foreground",
  danger: "border-transparent bg-red-500/15 text-red-200",
  warning: "border-transparent bg-amber-500/15 text-amber-200",
  success: "border-transparent bg-emerald-500/15 text-emerald-200",
  info: "border-transparent bg-sky-500/15 text-sky-200"
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: keyof typeof tones }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        tones[variant],
        className
      )}
      {...props}
    />
  );
}
