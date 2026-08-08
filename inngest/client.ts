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
    userId?: string;
    corsairTenantId?: string;
    repositoryOwner?: string;
    repositoryName?: string;
  };
};

/**
 * Event schema payload for github.webhook trigger.
 */
export type GithubWebhookEvent = {
  name: "github.webhook";
  data: {
    userId?: string;
    corsairTenantId?: string;
    action?: string | null;
    plugin?: string | null;
    repositoryOwner?: string;
    repositoryName?: string;
    payload?: Record<string, unknown>;
  };
};

/**
 * Event schema payload for activity.update trigger.
 */
export type UpdateActivityLogEvent = {
  name: "activity.update";
  data: {
    userId: string;
    corsairTenantId?: string;
    repositoryOwner?: string;
    repositoryName?: string;
  };
};

/**
 * Event schema payload for activity.continue_working trigger.
 */
export type GenerateContinueWorkingEvent = {
  name: "activity.continue_working";
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
  "github.webhook": GithubWebhookEvent;
  "activity.update": UpdateActivityLogEvent;
  "activity.continue_working": GenerateContinueWorkingEvent;
};

/**
 * Inngest client singleton for Talk to Your GitHub.
 */
export const inngest = new Inngest({
  id: "talk-to-your-github",
  schemas: new EventSchemas().fromRecord<Events>(),
});
