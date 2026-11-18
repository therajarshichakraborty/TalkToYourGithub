"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { GithubIcon } from "@/components/brand/github-icon";
import { signInWithGithub } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type='submit'
      disabled={pending}
      className='btn-brand h-12 w-full pl-5 pr-1.5 text-base disabled:opacity-80'
    >
      <span className='flex-1 text-left'>
        {pending ? "Redirecting to GitHub…" : "Continue with GitHub"}
      </span>
      <span className='flex size-9 items-center justify-center rounded-md bg-white shadow-sm'>
        {pending ? (
          <Loader2 className='size-4 animate-spin text-brand' />
        ) : (
          <GithubIcon className='size-4.5 text-neutral-900' />
        )}
      </span>
    </button>
  );
}

export function GithubSignInForm({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <form action={signInWithGithub}>
      {callbackUrl && <input type='hidden' name='callbackUrl' value={callbackUrl} />}
      <SubmitButton />
    </form>
  );
}
