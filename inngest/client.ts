import { Inngest, EventSchemas } from "inngest";

export type GithubConnectedEvent = {
  name: "github.connected";
  data: {
    userId: string;
    corsairTenantId?: string;
    repositoryOwner?: string;
    repositoryName?: string;
  };
};

type Events = {
  "github.connected": GithubConnectedEvent;
};

export const inngest = new Inngest({
  id: "talk-to-your-github",
  schemas: new EventSchemas().fromRecord<Events>(),
});
