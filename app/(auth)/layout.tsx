import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requireUnauth } from "@/features/auth/actions";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUnauth();

  return (
    <div className='relative flex min-h-svh flex-col overflow-hidden'>
      <div className='bg-grid mask-radial pointer-events-none absolute inset-0' />
      <div className='pointer-events-none absolute left-1/2 top-1/3 h-105 w-180 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,var(--color-brand),transparent)] opacity-[0.12]' />
      <header className='relative mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6'>
        <Logo />
        <ThemeToggle />
      </header>
      <main className='relative flex flex-1 items-center justify-center px-6 pb-16'>
        {children}
      </main>
    </div>
  );
}
