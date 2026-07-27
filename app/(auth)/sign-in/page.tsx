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
    <div className='flex w-full flex-col items-center gap-8'>
      <div className='flex flex-col items-center gap-3'>
          <svg
            viewBox='0 0 24 24'
            className='size-8'
            aria-hidden='true'
            fill='currentColor'
          >
            <path d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z' />
          </svg>
        <div className='text-center'>
          <h1 className='text-[22px] font-semibold tracking-tight text-foreground'>
            Talk to your GitHub
          </h1>
          <p className='text-[13px] leading-relaxed text-foreground'>
            Ask anything about your repos, commits,
            <br />
            and pull requests in plain English
          </p>
        </div>
      </div>

      <div className='w-95 rounded-2xl bg-transparent px-6 py-6'>
        <div className='space-y-2 -mt-8'>
          <GithubSignInForm callbackUrl={callbackUrl} />

          <div className='flex items-center justify-center gap-3 py-1'>
            <div className='flex items-center gap-3 text-[11px] text-foreground'>
              <span>Repos</span>
              <span className='text-border'>·</span>
              <span>Commits</span>
              <span className='text-border'>·</span>
              <span>PRs</span>
            </div>
          </div>

          <div className='flex items-center justify-center gap-1.5 text-[11px] text-foreground'>
            <span className='relative flex size-1.5 shrink-0'>
              <span className='absolute inline-flex size-full animate-ping rounded-full bg-lime-500' />
              <span className='relative inline-flex size-1.5 rounded-full bg-lime-500' />
            </span>
            Encrypted · Read-only by default · Revocable anytime
          </div>
        </div>
      </div>

      <p className='text-center text-[11px] text-foreground'>
        By continuing, you agree to our{" "}
        <span className='cursor-pointer text-foreground hover:text-muted-foreground transition-colors underline-offset-2 hover:underline'>
          Terms
        </span>
        <span className='cursor-pointer text-foreground hover:text-muted-foreground transition-colors underline-offset-2 hover:underline'>
          Privacy
        </span>
      </p>
    </div>
  );
};

export default SignInPage;
