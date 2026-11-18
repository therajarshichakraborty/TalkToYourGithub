import type { Metadata } from "next";
import { Overview } from "@/components/dashboard/overview";
import { AppShell } from "@/components/workspace/app-shell";
import { SyncButton } from "@/components/workspace/sync-button";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardPage() {
  return (
    <AppShell title='Overview' actions={<SyncButton />}>
      <Overview />
    </AppShell>
  );
}
