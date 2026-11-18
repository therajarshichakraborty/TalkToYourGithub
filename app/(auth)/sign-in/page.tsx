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
    <div className='w-full max-w-md'>
      <div className='animate-in fade-in zoom-in-95 slide-in-from-bottom-2 rounded-2xl bg-card/95 p-8 shadow-card backdrop-blur-xl duration-500 md:p-10'>
        <div className='space-y-3 text-center'>
          <h1 className='text-3xl font-bold tracking-[-0.03em]'>
            Welcome <span className='highlight'>back</span>
          </h1>
          <p className='text-[15px] text-muted-foreground'>
            Sign in with GitHub to talk to your repositories.
          </p>
        </div>

        <div className='mt-8'>
          <GithubSignInForm callbackUrl={callbackUrl} />
        </div>

        <ul className='dotted-t mt-8 space-y-3 pt-6'>
          {ASSURANCES.map((item) => (
            <li
              key={item}
              className='flex items-start gap-2.5 text-sm text-muted-foreground'
            >
              <span className='mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-brand/10'>
                <Check className='size-3 text-brand' />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <p className='mt-6 text-center text-sm text-foreground/60'>
        GitHub is the only sign-in method. No passwords to remember.
      </p>
    </div>
  );
}
