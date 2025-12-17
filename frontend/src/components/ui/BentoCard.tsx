import React from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  gradient?: boolean;
  glow?: boolean;
}

export function BentoCard({
  children,
  className,
  header,
  footer,
  gradient,
  glow,
}: BentoCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-sm transition-all hover:shadow-md",
        gradient && "bg-gradient-to-br from-background to-muted",
        glow && "shadow-lg shadow-primary/10",
        className
      )}
    >
      {header && <div className="mb-4">{header}</div>}
      <div className="space-y-4">{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
}
