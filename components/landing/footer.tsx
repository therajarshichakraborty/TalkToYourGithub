import Link from "next/link";
import { Logo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#product", label: "Overview" },
      { href: "/#features", label: "Features" },
      { href: "/#workflow", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/sign-in", label: "Sign in" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/#faq", label: "FAQ" },
    ],
  },
];

export function Footer() {
  return (
    <footer className='dotted-t'>
      <div className='grid gap-10 px-6 py-14 md:grid-cols-[2fr_1fr_1fr] md:px-14'>
        <div className='space-y-4'>
          <Logo />
          <p className='max-w-xs text-[15px] leading-relaxed text-muted-foreground'>
            A conversational interface for your GitHub repositories.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className='space-y-3'>
            <h4 className='text-sm font-semibold'>{col.title}</h4>
            <ul className='space-y-2'>
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className='inline-block text-[15px] text-muted-foreground transition-all duration-200 hover:translate-x-0.5 hover:text-foreground'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className='dotted-t flex flex-col gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between md:px-14'>
        <span>© {new Date().getFullYear()} Talk to your GitHub</span>
        <span>Not affiliated with GitHub, Inc.</span>
      </div>
    </footer>
  );
}
