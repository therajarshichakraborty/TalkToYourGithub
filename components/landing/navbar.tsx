"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";
import { PrimaryCta } from "./primary-cta";

const LINKS = [
  { href: "#features", label: "Product" },
  { href: "#workflow", label: "How it works" },
  { href: "#efficiency", label: "Efficiency" },
  { href: "#faq", label: "FAQ" },
];

export function Navbar({ isSignedIn }: { isSignedIn: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-colors duration-300",
        scrolled
          ? "border-border bg-background/75 backdrop-blur-xl"
          : "border-transparent",
      )}
    >
      <div className='mx-auto flex h-16 max-w-6xl items-center justify-between px-6'>
        <Logo />
        <nav className='hidden items-center gap-1 md:flex'>
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className='rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground'
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className='flex items-center gap-2'>
          <ThemeToggle />
          <PrimaryCta isSignedIn={isSignedIn} size='sm' />
        </div>
      </div>
    </header>
  );
}
