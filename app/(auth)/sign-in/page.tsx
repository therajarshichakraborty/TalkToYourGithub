import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GithubSignInForm } from '@/features/auth/components/github-sign-in-url';
import { GitBranch, GitCommit, GitPullRequest } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign In | Talk To Your GitHub',
  description: 'Sign in with your GitHub account to start talking with your repositories.',
};

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

const SignInPage = async ({ searchParams }: SignInPageProps) => {
  const { callbackUrl } = await searchParams;

  return (
    <div className="flex w-full max-w-sm flex-col items-center justify-center">
      <Card className="w-full border-foreground/10 shadow-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full border border-foreground/10 bg-foreground text-background">
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-xl tracking-tight">Talk to your GitHub</CardTitle>
            <CardDescription className="text-balance px-2 leading-relaxed">
              Sign in to chat with your repos, commits, and pull requests in plain English
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <GitBranch className="size-3.5" />
              Repos
            </span>
            <span className="flex items-center gap-1">
              <GitCommit className="size-3.5" />
              Commits
            </span>
            <span className="flex items-center gap-1">
              <GitPullRequest className="size-3.5" />
              Pull requests
            </span>
          </div>

          <GithubSignInForm callbackUrl={callbackUrl} />

          <p className="text-center text-xs text-muted-foreground">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignInPage;