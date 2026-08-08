import type { Metadata } from "next";
import { GithubSignInForm } from "@/features/auth/components/github-sign-in-url";

export const metadata: Metadata = {
  title: "Sign In | Talk To Your GitHub",
  description:
    "Sign in with your GitHub account to start talking with your repositories.",
};

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

const SignInPage = async ({ searchParams }: SignInPageProps) => {
  const { callbackUrl } = await searchParams;

  return (
    <div className='flex w-full flex-col items-center justify-center min-h-[80vh] gap-6 px-4 relative'>
      {/* Background ambient glow */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none' />

      <div className='flex flex-col items-center gap-4 text-center relative z-10 max-w-md'>
        <div className='flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xl shadow-indigo-500/30 transition-transform duration-300 hover:scale-105'>
          <svg
            viewBox='0 0 24 24'
            className='size-8'
            aria-hidden='true'
            fill='currentColor'
          >
            <path d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z' />
          </svg>
        </div>

        <div>
          <h1 className='text-2xl font-bold tracking-tight text-foreground sm:text-3xl'>
            Talk to your GitHub
          </h1>
          <p className='text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed'>
            Ask questions about repositories, commits, and pull requests in
            plain natural language.
          </p>
        </div>
      </div>

      <div className='w-full max-w-sm rounded-3xl border border-indigo-200/60 dark:border-indigo-900/40 bg-card/90 p-6 shadow-xl shadow-indigo-500/5 backdrop-blur-md relative z-10'>
        <div className='space-y-4'>
          <GithubSignInForm callbackUrl={callbackUrl} />

          <div className='flex items-center justify-center gap-3 pt-2 text-[11px] font-semibold text-muted-foreground'>
            <span>Repos</span>
            <span className='text-indigo-500 font-bold'>·</span>
            <span>Commits</span>
            <span className='text-indigo-500 font-bold'>·</span>
            <span>PRs</span>
          </div>

          <div className='flex items-center justify-center gap-2 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 p-2 rounded-xl border border-indigo-200/50 dark:border-indigo-900/30'>
            <span className='relative flex size-2 shrink-0'>
              <span className='absolute inline-flex size-full animate-ping rounded-full bg-indigo-500 opacity-75' />
              <span className='relative inline-flex size-2 rounded-full bg-indigo-500' />
            </span>
            Encrypted | Read-only by default | Revocable anytime
          </div>
        </div>
      </div>

      <p className='text-center text-[11px] text-muted-foreground relative z-10'>
        By continuing, you agree to our{" "}
        <span className='cursor-pointer text-indigo-600 hover:underline transition-colors font-medium'>
          Terms
        </span>{" "}
        &{" "}
        <span className='cursor-pointer text-indigo-600 hover:underline transition-colors font-medium'>
          Privacy Policy
        </span>
      </p>
    </div>
  );
};

export default SignInPage;
