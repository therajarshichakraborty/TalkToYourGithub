"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SyncButton({
  owner,
  name,
  label = "Sync insights",
}: {
  owner?: string;
  name?: string;
  label?: string;
}) {
  const [pending, setPending] = useState(false);

  const trigger = async () => {
    setPending(true);
    try {
      const res = await fetch("/api/inngest/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed.");
      toast.success("Sync queued", {
        description: `Summaries, activity and search memory for ${data.scope} will refresh in the background.`,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <Button
      variant='outline'
      size='sm'
      onClick={trigger}
      disabled={pending}
      className='h-8 gap-1.5 text-xs'
    >
      {pending ? <Loader2 className='animate-spin' /> : <Sparkles />}
      <span className='hidden sm:inline'>{label}</span>
    </Button>
  );
}
