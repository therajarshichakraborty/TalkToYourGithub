import { EventSchemas, Inngest } from "inngest";

export interface SyncScope {
  userId: string;
  corsairTenantId?: string;
  repositoryOwner: string;
  repositoryName: string;
}

type Events = {
  "github.connected": { data: SyncScope };
  "github.webhook": { data: SyncScope };
  "embeddings.generate": { data: SyncScope };
  "activity.update": { data: SyncScope };
  "activity.continue_working": { data: SyncScope };
};

export const inngest = new Inngest({
  id: "talk-to-your-github",
  schemas: new EventSchemas().fromRecord<Events>(),
});
