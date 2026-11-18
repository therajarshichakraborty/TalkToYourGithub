import { Logo } from "@/components/brand/logo";
import { MountainBackdrop } from "@/components/landing/mountain-backdrop";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { requireUnauth } from "@/features/auth/actions";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUnauth();

  return (
    <div className='px-0 md:px-6'>
      <div className='dotted-x relative mx-auto flex min-h-svh max-w-6xl flex-col overflow-hidden'>
        <MountainBackdrop priority className='h-140' />
        <header className='relative flex h-20 items-center justify-between px-6 md:px-10'>
          <Logo />
          <ThemeToggle />
        </header>
        <main className='relative flex flex-1 items-center justify-center px-6 pb-20'>
          {children}
        </main>
      </div>
    </div>
  );
}
