import { Check } from "lucide-react";
import type { Metadata } from "next";
import { GithubSignInForm } from "@/features/auth/components/github-sign-in-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with GitHub to start talking to your repositories.",
};

const ASSURANCES = [
  "Requests use your own GitHub token",
  "The assistant can read, never write, on its own",
  "Revoke access any time from GitHub settings",
];

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className='w-full max-w-sm'>
      <div className='rounded-2xl border bg-card/80 p-8 shadow-card backdrop-blur-xl'>
        <div className='space-y-2 text-center'>
          <h1 className='text-2xl font-semibold tracking-tight'>Welcome back</h1>
          <p className='text-sm text-muted-foreground'>
            Sign in to talk to your repositories.
          </p>
        </div>

        <div className='mt-8'>
          <GithubSignInForm callbackUrl={callbackUrl} />
        </div>

        <ul className='mt-8 space-y-2.5 border-t pt-6'>
          {ASSURANCES.map((item) => (
            <li
              key={item}
              className='flex items-start gap-2.5 text-xs text-muted-foreground'
            >
              <Check className='mt-px size-3.5 shrink-0 text-success' />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <p className='mt-6 text-center text-xs text-muted-foreground'>
        GitHub is the only sign-in method. No passwords to remember.
      </p>
    </div>
  );
}
