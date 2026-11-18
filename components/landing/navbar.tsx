import { Fragment } from "react";
import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PrimaryCta } from "./primary-cta";

const LINKS = [
  { href: "/#product", label: "Product" },
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function Navbar({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <header className='sticky top-4 z-50 px-4 pt-6 md:px-10'>
      <nav className='mx-auto flex h-17 max-w-4xl animate-in fade-in slide-in-from-top-3 items-stretch rounded-xl bg-card/90 shadow-card backdrop-blur-xl duration-700'>
        <Link
          href='/'
          className='group flex items-center gap-2.5 pl-5 pr-6 text-lg font-semibold tracking-tight'
        >
          <LogoMark className='size-7 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105' />
          <span className='hidden sm:inline'>Talk to your GitHub</span>
        </Link>

        <div className='my-3 border-l-2 border-dotted border-dot' />

        <div className='hidden flex-1 items-center justify-center gap-4 md:flex'>
          {LINKS.map((link, i) => (
            <Fragment key={link.href}>
              {i > 0 && (
                <span
                  className='size-1.5 rounded-full bg-brand'
                  aria-hidden='true'
                />
              )}
              <Link
                href={link.href}
                className='link-underline text-[15px] font-medium text-foreground/80 transition-colors hover:text-foreground'
              >
                {link.label}
              </Link>
            </Fragment>
          ))}
        </div>
        <div className='flex-1 md:hidden' />

        <div className='my-3 border-l-2 border-dotted border-dot' />

        <div className='flex items-center gap-1.5 pl-3 pr-2'>
          <ThemeToggle />
          <PrimaryCta isSignedIn={isSignedIn} size='sm' />
        </div>
      </nav>
    </header>
  );
}
