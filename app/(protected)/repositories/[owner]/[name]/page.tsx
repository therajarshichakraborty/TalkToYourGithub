import type { Metadata } from "next";
import Link from "next/link";
import { RepositoryView } from "@/components/repository/repository-view";
import { AppShell } from "@/components/workspace/app-shell";

type Params = Promise<{ owner: string; name: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { owner, name } = await params;
  return { title: `${decodeURIComponent(owner)}/${decodeURIComponent(name)}` };
}

export default async function RepositoryPage({ params }: { params: Params }) {
  const { owner: rawOwner, name: rawName } = await params;
  const owner = decodeURIComponent(rawOwner);
  const name = decodeURIComponent(rawName);

  return (
    <AppShell
      contentClassName='overflow-hidden'
      title={
        <nav className='flex items-center gap-1.5 text-sm'>
          <Link href='/dashboard' className='text-muted-foreground hover:text-foreground'>
            Repositories
          </Link>
          <span className='text-muted-foreground'>/</span>
          <span className='truncate'>{name}</span>
        </nav>
      }
    >
      <RepositoryView key={`${owner}/${name}`} owner={owner} name={name} />
    </AppShell>
  );
}
