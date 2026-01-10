"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import FluidGlass from "@/components/FluidGlass";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cfo-dashboard", label: "CFO View" },
  { href: "/transactions", label: "Transactions" },
  { href: "/financial-health", label: "Financial Health" },
];

const NewHeader = () => {
  const pathname = usePathname();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <FluidGlass
        blur={8}
        className="rounded-full overflow-hidden"
        contentClassName="flex items-center justify-center gap-6 px-6 py-3"
        shadowColor="rgba(0,0,0,0.2)"
        shadowConfig={{
          shadow: "0 8px 32px 0 rgba(0,0,0,0.2)",
        }}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full overflow-hidden bg-white flex items-center justify-center">
            <Image
              src="/hospitalLogo.jpeg"
              alt="Sai Vishwas Hospitals"
              width={32}
              height={32}
              className="object-cover"
            />
          </div>
          <span className="text-lg font-semibold text-foreground">
            Sai Vishwas Hospitals
          </span>
        </Link>

        <div className="h-6 w-px bg-border" />

        <nav>
          <ul className="flex items-center gap-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
                    pathname === link.href && "text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </FluidGlass>
    </div>
  );
};

export default NewHeader;
