import { Inngest, EventSchemas } from "inngest";

/**
 * Event schema payload for github.connected trigger.
 */
export type GithubConnectedEvent = {
  name: "github.connected";
  data: {
    userId: string;
    corsairTenantId?: string;
    repositoryOwner?: string;
    repositoryName?: string;
  };
};

/**
 * Event schema payload for embeddings.generate trigger.
 */
export type GenerateEmbeddingsEvent = {
  name: "embeddings.generate";
  data: {
    userId: string;
    corsairTenantId?: string;
    repositoryOwner?: string;
    repositoryName?: string;
  };
};

/**
 * Type map for all supported Inngest events.
 */
type Events = {
  "github.connected": GithubConnectedEvent;
  "embeddings.generate": GenerateEmbeddingsEvent;
};

/**
 * Inngest client singleton for Talk to Your GitHub.
 */
export const inngest = new Inngest({
  id: "talk-to-your-github",
  schemas: new EventSchemas().fromRecord<Events>(),
});
