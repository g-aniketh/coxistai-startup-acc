"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ShadowConfig = {
  shadow: string;
};

interface FluidGlassProps {
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  blur?: number;
  shadowColor?: string;
  shadowConfig?: ShadowConfig;
}

export default function FluidGlass({
  children,
  className,
  contentClassName,
  blur = 8,
  shadowColor = "rgba(0,0,0,0.1)",
  shadowConfig = {
    shadow: "0 8px 32px 0 rgba(0,0,0,0.1)",
  },
}: FluidGlassProps) {
  return (
    <div
      className={cn("relative", className)}
      style={
        {
          "--blur": `${blur}px`,
          "--shadow-color": shadowColor,
          boxShadow: shadowConfig.shadow,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "relative z-10 h-full w-full overflow-hidden rounded-[inherit]",
          contentClassName
        )}
      >
        {children}
      </div>
      <div
        className="absolute inset-0 z-0 rounded-[inherit] bg-white/10"
        style={{ backdropFilter: "blur(var(--blur))" }}
      />
    </div>
  );
}
