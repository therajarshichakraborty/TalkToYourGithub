//@ts-nocheck
"use client";

import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";
import { signInWithGithub } from "../actions";

function GitHubIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      className={className}
      aria-hidden='true'
      fill='currentColor'
    >
      <path d='M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z' />
    </svg>
  );
}

function LoadingDots() {
  return (
    <span className='flex items-center gap-1' aria-hidden='true'>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className='inline-block size-1 rounded-full bg-current opacity-0'
          style={{
            animation: `dotFade 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes dotFade {
          0%, 80%, 100% { opacity: 0; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </span>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type='submit'
      disabled={pending}
      className='group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-foreground py-3 text-[14px] font-medium text-background shadow-sm transition-all duration-200 hover:bg-foreground/90 hover:shadow-md active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 focus-visible:ring-offset-2 text-center px-17'
    >
      {pending ? (
        <>
          <span className='relative text-sm'>Connecting</span>
          <LoadingDots />
        </>
      ) : (
        <>
          <GitHubIcon className='relative size-[18px] transition-transform duration-200 group-hover:-rotate-6 text-center flex justify-center items-center' />
          <span className='relative text-center'>Continue with GitHub</span>
          <svg
            className='relative ml-auto size-3.5 opacity-0 transition-all duration-200 group-hover:opacity-50 group-hover:translate-x-0.5 text-center flex justify-center items-center'
            viewBox='0 0 16 16'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
          >
            <path
              d='M3 8h10M9 4l4 4-4 4'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </svg>
        </>
      )}
    </button>
  );
}

type GithubSignInFormProps = {
  callbackUrl?: string;
};

export function GithubSignInForm({ callbackUrl }: GithubSignInFormProps) {
  return (
    <form action={signInWithGithub} className='w-full'>
      {callbackUrl ? (
        <input type='hidden' name='callbackUrl' value={callbackUrl} />
      ) : null}
      <SubmitButton />
    </form>
  );
}
