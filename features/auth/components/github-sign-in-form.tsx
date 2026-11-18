"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { GithubIcon } from "@/components/brand/github-icon";
import { Button } from "@/components/ui/button";
import { signInWithGithub } from "../actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type='submit'
      disabled={pending}
      className='group shadow-button h-11 w-full rounded-xl text-sm font-medium'
    >
      {pending ? (
        <Loader2 className='size-4 animate-spin' />
      ) : (
        <GithubIcon className='size-4' />
      )}
      {pending ? "Redirecting to GitHub…" : "Continue with GitHub"}
      {!pending && (
        <ArrowRight className='ml-auto size-4 opacity-60 transition-transform group-hover:translate-x-0.5' />
      )}
    </Button>
  );
}

export function GithubSignInForm({ callbackUrl }: { callbackUrl?: string }) {
  return (
    <form action={signInWithGithub}>
      {callbackUrl && (
        <input type='hidden' name='callbackUrl' value={callbackUrl} />
      )}
      <SubmitButton />
    </form>
  );
}
