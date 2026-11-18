import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#workflow", label: "How it works" },
      { href: "#efficiency", label: "Efficiency" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-in", label: "Sign in" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "#faq", label: "FAQ" },
    ],
  },
];

export function Footer() {
  return (
    <footer className='border-t'>
      <div className='mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[2fr_1fr_1fr]'>
        <div className='space-y-4'>
          <Logo />
          <p className='max-w-xs text-sm leading-relaxed text-muted-foreground'>
            A conversational interface for your GitHub repositories.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className='space-y-3'>
            <h4 className='font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground'>
              {col.title}
            </h4>
            <ul className='space-y-2'>
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className='text-sm text-muted-foreground transition-colors hover:text-foreground'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className='mx-auto flex max-w-6xl flex-col gap-2 border-t px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:justify-between'>
        <span>© {new Date().getFullYear()} Talk to your GitHub</span>
        <span>Not affiliated with GitHub, Inc.</span>
      </div>
    </footer>
  );
}
