import { inngest } from "../client";
import { getCommits } from "@/lib/tools/get-commits";
import { generateText } from "ai";
import { chatModel } from "@/features/chat";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, ilike } from "drizzle-orm";

/**
 * Inngest function: generateContinueWorking
 * Reads recent developer activity logs from activityLogs database table and uses LLM text synthesis
 * to construct a Continue Working summary card for a specific repository (or overall dashboard).
 */
export const generateContinueWorking = inngest.createFunction(
  {
    id: "generate-continue-working",
    name: "Generate Continue Working Dashboard Summary",
  },
  [{ event: "activity.continue_working" }, { event: "github.connected" }],
  async ({ event, step }) => {
    const { corsairTenantId, repositoryOwner, repositoryName } = event.data;
    let userId = event.data.userId;

    // Resolve userId if needed
    if (!userId && corsairTenantId) {
      const [foundUser] = await db
        .select()
        .from(schema.user)
        .where(eq(schema.user.corsairTenantId, corsairTenantId))
        .limit(1);
      if (foundUser) {
        userId = foundUser.id;
      }
    }

    if (!userId) {
      const [defaultUser] = await db.select().from(schema.user).limit(1);
      if (defaultUser) {
        userId = defaultUser.id;
      }
    }

    if (!userId) {
      throw new Error("[generateContinueWorking] Cannot generate summary: missing userId.",)

    }


    const runSuffix = event.id ? `-${event.id}` : "";

    /**
     * Step 1: Read recent developer activity logs from database for the specified repository.
     */
    const recentLogs = await step.run(
      `fetch-recent-activities${runSuffix}`,
      async () => {
      const conditions = [eq(schema.activityLogs.userId, userId)];
      if (repositoryOwner) {
        conditions.push(
          ilike(schema.activityLogs.repositoryOwner, repositoryOwner),
        );
      }
      if (repositoryName) {
        conditions.push(
          ilike(schema.activityLogs.repositoryName, repositoryName),
        );
      }

      const logs = await db
        .select()
        .from(schema.activityLogs)
        .where(and(...conditions))
        .orderBy(desc(schema.activityLogs.occurredAt))
        .limit(15);

      if (logs.length > 0) {
        return logs.map((l) => ({
          repo: `${l.repositoryOwner}/${l.repositoryName}`,
          type: l.activityType,
          title: l.title,
          description: l.description,
          occurredAt: l.occurredAt?.toISOString() || String(l.occurredAt),
        }));
      }

      // Fallback: Fetch recent commits via Live API if DB activityLogs is empty for this repository
      if (repositoryOwner && repositoryName) {
        try {
          const commitsRes = await getCommits({
            userId,
            tenantId: corsairTenantId,
            owner: repositoryOwner,
            repo: repositoryName,
            perPage: 10,
          });
          if (commitsRes.success && commitsRes.commits?.length) {
            return commitsRes.commits.map((c) => ({
              repo: `${repositoryOwner}/${repositoryName}`,
              type: "commit",
              title: c.commit?.message || "Commit",
              description: c.sha || "",
              occurredAt: c.commit?.author?.date || new Date().toISOString(),
            }));
          }
        } catch (e) {
          console.warn(
            "[generateContinueWorking] Fallback commit fetch note:",
            e,
          );
        }
      }

      return [];
    });

    if (!recentLogs.length) {
      const targetName =
        repositoryOwner && repositoryName
          ? `${repositoryOwner}/${repositoryName}`
          : "the requested repository";
      return {
        success: true,
        message: `No recent activity logs available for ${targetName} to summarize.`,
      };
    }

    /**
     * Step 2: Synthesize repository-specific Continue Working summary via AI text generation.
     */
    const summaryText = await step.run(
      `synthesize-continue-working-summary${runSuffix}`,
      async () => {
        const targetRepoStr =
          repositoryOwner && repositoryName
            ? `${repositoryOwner}/${repositoryName}`
            : "the requested repository";

        const activityListStr = recentLogs
          .map(
            (a) =>
              `* [${a.repo}] (${a.type}): ${a.title} - ${a.description} (${a.occurredAt})`,
          )
          .join("\n");

        const prompt = `
# ROLE

You are an AI developer productivity assistant embedded inside a developer
dashboard. Your job is to generate a short "Continue Working" summary card
that helps a developer instantly re-orient themselves on a specific
repository after time away from it. Developers see many of these cards
across many repositories, so precision and repository-specificity are
critical — a card that could apply to any project is a failed card.

# TARGET REPOSITORY

You are writing exclusively about this repository:

${targetRepoStr}

This is the ONLY repository you are allowed to discuss. If the activity log
below contains any events, commits, PRs, or issues that reference a
different repository, a different project name, or a different codebase,
you must ignore them completely. Do not mention them, do not summarize
them, and do not let them influence your recommendation in paragraph 2. Do
not include comparisons to other repositories, even in passing.

# RECENT ACTIVITY LOG

${activityListStr}

# OUTPUT FORMAT

Produce exactly 2 paragraphs. No headers, no title, no bullet points, no
numbered lists, no bold text, no markdown formatting of any kind — plain
prose only, ready to be dropped directly into a UI card. Do not label the
paragraphs ("Paragraph 1:", "Summary:", etc.) in your output; just write the
two paragraphs back to back separated by a single blank line.

# PARAGRAPH 1 — RECENT ACTIVITY SUMMARY

Summarize, strictly and only for "${targetRepoStr}", what has happened
recently based on the activity log. This includes:
- Commits: what was changed, added, fixed, or refactored, and by whom if
  authorship is available.
- Pull requests: what was opened, merged, reviewed, or is still pending,
  and what each one appears to accomplish.
- Issues: what was filed, closed, reopened, or is still open, and what
  problems they describe.

Synthesize these into a narrative of what has been going on, rather than
restating each log entry as a separate sentence. Group related activity
together — for example, if three commits and a PR all relate to the same
feature or bug, describe them as one thread of work rather than four
disconnected events.

Order the narrative roughly by recency and importance: lead with the most
significant or most recent thread of work, then mention smaller or older
items more briefly. If the log spans a mix of feature work, bug fixes, and
maintenance (dependency bumps, formatting, CI tweaks), distinguish between
these categories so the reader understands not just what changed but what
kind of work it was.

If authorship data shows multiple contributors active in the log, it is fine
to note that more than one person has been working on the repository
recently. If everything comes from a single author, do not make a point of
it unless it is directly relevant to the recommendation in paragraph 2.

Use concrete details pulled from the log (function names, file names,
feature names, issue titles) rather than vague descriptions. "Fixed a race
condition in the WebSocket reconnect handler" is far more useful than
"fixed some bugs." Only use details that are actually present in the
activity log — do not invent specifics that are not supported by the log
content.

# PARAGRAPH 2 — RECOMMENDED NEXT ACTION

Based strictly on the activity you just summarized for "${targetRepoStr}",
recommend the single most logical next action or a short set of closely
related next actions for the developer to take when they resume work. This
should feel like advice from a colleague who has been paying close
attention to the repository, not a generic productivity tip.

Ground the recommendation in evidence from the log. Consider signals such
as:
- An open PR that appears close to mergeable but is awaiting review, tests,
  or a final fix — recommend finishing and merging it.
- A recently merged PR or commit that introduced a feature without
  accompanying tests, docs, or follow-up cleanup — recommend adding them.
- Open issues that relate directly to the most recent commits — recommend
  addressing the most urgent or most connected one first.
- A string of bug-fix commits touching the same area of code — recommend
  investigating whether there is a deeper underlying issue worth fixing
  properly rather than continuing to patch symptoms.
- A burst of commits followed by a gap in activity — recommend picking back
  up where the last commit left off, referencing what that commit was
  doing.
- Dependency or infrastructure changes with no follow-up — recommend
  verifying the change didn't break anything and that CI is green.

Pick the recommendation that is most strongly supported by the log, not
just the most recent event by timestamp. If multiple next steps are
reasonably well supported, you may mention up to two, but present one as
the clear priority and the other as a secondary follow-up, rather than
listing them with equal weight.

Phrase the recommendation actionably — start from what the developer should
actually do, not what the state of the repository is (that belongs in
paragraph 1). Avoid vague suggestions like "continue improving the
codebase" or "keep up the good work." Every recommendation should be
something a developer could act on in their next coding session.

# STYLE AND TONE RULES

- Write in a warm, competent, slightly informal tone — like a sharp
  teammate giving a quick standup-style update, not a corporate status
  report.
- Use second person sparingly and naturally where it helps directness (e.g.
  "you'll want to," "your last commit left off at") but do not overuse it.
- Keep sentences tight. Prefer several short, information-dense sentences
  over one long compound sentence trying to do everything.
- Do not use hedging language ("it seems," "possibly," "it looks like")
  more than once across the whole card. State things plainly when the log
  supports them.
- Avoid generic filler phrases: "great progress has been made," "the team
  is doing well," "this is an important project." Every sentence should
  carry specific, repository-relevant information.
- Do not restate the raw activity log verbatim or copy commit message text
  wholesale — paraphrase in your own words, while preserving exact proper
  nouns, function names, file paths, and issue numbers for accuracy.
- Do not include timestamps, IDs, or raw log formatting artifacts in the
  output — translate them into natural language (e.g. "a few days ago,"
  "the most recent commit," "issue #482").
- Keep the whole card concise: each paragraph should be roughly 3–6
  sentences. This is a dashboard card, not a report — it must be scannable
  in a few seconds.

# HANDLING SPARSE OR EMPTY ACTIVITY

If the activity log for "${targetRepoStr}" is empty, extremely sparse, or
contains only noise (e.g. automated bot commits, formatting-only changes)
with nothing substantive to summarize:
- Say so plainly and briefly in paragraph 1 rather than fabricating
  activity that did not happen.
- In paragraph 2, recommend a sensible starting point given the lack of
  recent work — for example, reviewing open issues to pick up new work, or
  checking whether the repository is still actively maintained — rather
  than inventing a fake "next task" that has no basis in the log.

If the activity log mixes genuine "${targetRepoStr}" activity with entries
from other repositories, extract and use only the entries that are clearly
about "${targetRepoStr}" and silently discard the rest — do not comment on
the fact that other repositories were present in the input.

# WHAT NOT TO DO

- Do not mention any repository other than "${targetRepoStr}" by name, even
  to say it will not be discussed.
- Do not output JSON, YAML, markdown headers, bullet points, or code
  fences — plain prose paragraphs only.
- Do not include a title, label, or "Continue Working" heading in the
  output text itself; the calling application already provides that framing
  in the UI.
- Do not ask the developer questions or address them as if in a live
  conversation ("What would you like to do next?").
- Do not include meta-commentary about this task or your instructions (e.g.
  do not write "Based on the activity log provided...").
- Do not fabricate commit authors, dates, PR numbers, or issue numbers that
  are not present in the activity log.
- Do not exceed 2 paragraphs under any circumstances.

# FINAL OUTPUT

Return only the final 2-paragraph "Continue Working" summary card as plain
text, with no preamble, no closing remarks, and no formatting markup.
`.trim();

        const { text } = await generateText({
          model: chatModel,
          prompt,
        });

        return text;
      },
    );

    /**
     * Step 3: Persist Continue Working summary into activityLogs table for this repository.
     */
    await step.run(`store-continue-working-summary${runSuffix}`, async () => {
      const repoKey =
        repositoryOwner && repositoryName
          ? `${repositoryOwner}_${repositoryName}`
          : "global";
      const activityId = `continue_working_summary_${userId}_${repoKey}`;

      await db
        .delete(schema.activityLogs)
        .where(
          and(
            eq(schema.activityLogs.userId, userId),
            eq(schema.activityLogs.activityId, activityId),
          ),
        )
        .catch(() => {
          // Ignore delete error if record does not exist
        });

      await db.insert(schema.activityLogs).values({
        userId,
        repositoryOwner: repositoryOwner || "all",
        repositoryName: repositoryName || "all",
        activityType: "review",
        activityId,
        title: repositoryName
          ? `Continue Working Summary: ${repositoryName}`
          : "Continue Working Dashboard Summary",
        description: summaryText,
        metadata: {
          generatedAt: new Date().toISOString(),
          logCount: recentLogs.length,
          targetRepo: repositoryName || "all",
        },
        occurredAt: new Date(),
      });
    });

    return {
      success: true,
      repository:
        repositoryOwner && repositoryName
          ? `${repositoryOwner}/${repositoryName}`
          : "all",
      summary: summaryText,
    };
  },
);
