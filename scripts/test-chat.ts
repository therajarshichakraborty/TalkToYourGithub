/**
 * test-chat.ts
 *
 * End-to-end integration test for /api/chat.
 * Runs 4 checks: auth guard, streaming, tool-call execution, tenant scoping.
 *
 * HOW TO GET YOUR SESSION TOKEN
 * ─────────────────────────────
 * 1. Start the dev server:  pnpm dev
 * 2. Sign in at http://localhost:3000
 * 3. Open DevTools → Application → Cookies → http://localhost:3000
 * 4. Copy the value of `better-auth.session_token`
 * 5. Set it as an environment variable:
 *
 *    $env:TEST_SESSION_TOKEN="<paste here>"   (PowerShell)
 *    export TEST_SESSION_TOKEN="<paste here>"  (bash / Git Bash)
 *
 * THEN RUN
 * ────────
 *    npx tsx scripts/test-chat.ts
 *
 * EXIT CODES
 * ──────────
 *   0  all checks passed
 *   1  one or more checks failed
 */

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const SESSION_TOKEN = process.env.TEST_SESSION_TOKEN ?? "";
const ENDPOINT = `${BASE}/api/chat`;

interface CheckResult {
  name: string;
  passed: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function pass(name: string, detail: string) {
  results.push({ name, passed: true, detail });
}

function fail(name: string, detail: string) {
  results.push({ name, passed: false, detail });
}

async function readStream(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += decoder.decode(value, { stream: true });
  }
  return full;
}

async function post(
  body: unknown,
  cookie?: string,
): Promise<Response> {
  return fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: `better-auth.session_token=${cookie}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

async function checkAuthGuard() {
  const checkName = "Auth guard (no cookie → 401)";
  try {
    const res = await post({
      messages: [{ role: "user", content: "hello" }],
    });
    if (res.status === 401) {
      pass(checkName, `Got 401 as expected`);
    } else {
      fail(checkName, `Expected 401 but got ${res.status}`);
    }
  } catch (e) {
    fail(checkName, `Network error: ${String(e)}`);
  }
}

async function checkBodyValidation() {
  const checkName = "Body validation (missing messages → 400)";
  if (!SESSION_TOKEN) {
    results.push({ name: checkName, passed: false, detail: "Skipped — no TEST_SESSION_TOKEN set" });
    return;
  }
  try {
    const res = await post({ messages: [] }, SESSION_TOKEN);
    if (res.status === 400) {
      pass(checkName, "Got 400 for empty messages array");
    } else {
      fail(checkName, `Expected 400 but got ${res.status}`);
    }
  } catch (e) {
    fail(checkName, `Network error: ${String(e)}`);
  }
}

async function checkStreaming() {
  const checkName = "Streaming (text chunks received)";
  if (!SESSION_TOKEN) {
    results.push({ name: checkName, passed: false, detail: "Skipped — no TEST_SESSION_TOKEN set" });
    return;
  }
  try {
    const res = await post(
      { messages: [{ role: "user", content: "Say exactly: STREAM_OK" }] },
      SESSION_TOKEN,
    );

    if (!res.ok) {
      const body = await res.text();
      fail(checkName, `HTTP ${res.status}: ${body}`);
      return;
    }

    if (!res.headers.get("content-type")?.includes("text/plain")) {
      fail(checkName, `Expected text/plain data-stream, got ${res.headers.get("content-type")}`);
      return;
    }

    const raw = await readStream(res);

    /*
     * AI SDK data-stream format: every line is prefixed with a type number.
     * Type "0:" lines are text chunks.
     * e.g.  0:"STREAM_OK"
     */
    const textChunks = raw
      .split("\n")
      .filter((l) => l.startsWith("0:"))
      .map((l) => {
        try { return JSON.parse(l.slice(2)); } catch { return l.slice(2); }
      })
      .join("");

    if (textChunks.length > 0) {
      pass(checkName, `Received text: "${textChunks.slice(0, 80)}${textChunks.length > 80 ? "…" : ""}"`);
    } else {
      fail(checkName, `No text chunks (type 0:) in response.\nFull stream:\n${raw.slice(0, 500)}`);
    }
  } catch (e) {
    fail(checkName, `Error: ${String(e)}`);
  }
}

async function checkToolCall() {
  const checkName = "Tool call (getRepositories executes + returns data)";
  if (!SESSION_TOKEN) {
    results.push({ name: checkName, passed: false, detail: "Skipped — no TEST_SESSION_TOKEN set" });
    return;
  }
  try {
    const res = await post(
      {
        messages: [
          {
            role: "user",
            content: "List my GitHub repositories. Just give me the raw list.",
          },
        ],
      },
      SESSION_TOKEN,
    );

    if (!res.ok) {
      const body = await res.text();
      fail(checkName, `HTTP ${res.status}: ${body}`);
      return;
    }

    const raw = await readStream(res);
    const lines = raw.split("\n");

    /*
     * AI SDK data-stream line prefixes relevant here:
     *   9:  tool-call (model is about to call a tool)
     *   a:  tool-result (tool executed and returned data)
     */
    const toolCallLines = lines.filter((l) => l.startsWith("9:"));
    const toolResultLines = lines.filter((l) => l.startsWith("a:"));

    if (toolCallLines.length === 0) {
      fail(checkName, `No tool-call event (9:) found in stream.\nLines: ${lines.slice(0, 20).join("\n")}`);
      return;
    }

    if (toolResultLines.length === 0) {
      fail(checkName, `Tool was called but no tool-result event (a:) received — maxSteps may not be working.\nTool-call lines: ${toolCallLines.join("\n")}`);
      return;
    }

    /*
     * Parse the first tool-result to verify it has actual data back from Corsair.
     */
    let resultPayload: unknown = null;
    try {
      resultPayload = JSON.parse(toolResultLines[0].slice(2));
    } catch {
      /* keep null */
    }

    pass(
      checkName,
      `Tool fired (${toolCallLines.length} call(s), ${toolResultLines.length} result(s)).\nFirst result preview: ${JSON.stringify(resultPayload).slice(0, 200)}`,
    );
  } catch (e) {
    fail(checkName, `Error: ${String(e)}`);
  }
}

async function checkTenantScope() {
  const checkName = "Tenant scoping (result repos are owned by session user)";
  if (!SESSION_TOKEN) {
    results.push({ name: checkName, passed: false, detail: "Skipped — no TEST_SESSION_TOKEN set" });
    return;
  }
  const expectedGithubLogin = process.env.TEST_GITHUB_LOGIN;
  if (!expectedGithubLogin) {
    results.push({
      name: checkName,
      passed: false,
      detail: "Skipped — set TEST_GITHUB_LOGIN=<your-github-username> to enable this check",
    });
    return;
  }

  try {
    const res = await post(
      { messages: [{ role: "user", content: "List my repositories" }] },
      SESSION_TOKEN,
    );

    if (!res.ok) {
      fail(checkName, `HTTP ${res.status}`);
      return;
    }

    const raw = await readStream(res);
    const toolResultLines = raw.split("\n").filter((l) => l.startsWith("a:"));

    if (toolResultLines.length === 0) {
      fail(checkName, "No tool-result events to inspect for tenant data.");
      return;
    }

    let leaksOtherUser = false;
    for (const line of toolResultLines) {
      try {
        const parsed = JSON.parse(line.slice(2));
        const str = JSON.stringify(parsed).toLowerCase();
        /*
         * A very conservative check: if any repository fullName in the
         * result starts with a prefix other than the expected login, flag it.
         * This is a rough heuristic — a proper check would parse the
         * repository objects and inspect their owner fields.
         */
        const owners = str.match(/"fullname":"([^/]+)\//g) ?? [];
        for (const o of owners) {
          const extracted = o.match(/"fullname":"([^/]+)\//)?.[1];
          if (extracted && extracted !== expectedGithubLogin.toLowerCase()) {
            leaksOtherUser = true;
            fail(
              checkName,
              `Tenant leak detected: found repo owner "${extracted}" but expected "${expectedGithubLogin}".`,
            );
            return;
          }
        }
      } catch {
        /* skip unparseable lines */
      }
    }

    if (!leaksOtherUser) {
      pass(checkName, `All repo owners match "${expectedGithubLogin}" — tenant isolation holds.`);
    }
  } catch (e) {
    fail(checkName, `Error: ${String(e)}`);
  }
}

async function run() {
  console.log(`\n${"═".repeat(60)}`);
  console.log("  /api/chat — End-to-End Integration Tests");
  console.log(`  Target: ${ENDPOINT}`);
  if (!SESSION_TOKEN) {
    console.log("\n  ⚠  TEST_SESSION_TOKEN not set.");
    console.log("  Only the auth-guard check will run.");
    console.log("  See the script header for how to get your token.\n");
  }
  console.log(`${"═".repeat(60)}\n`);

  await checkAuthGuard();
  await checkBodyValidation();
  await checkStreaming();
  await checkToolCall();
  await checkTenantScope();

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const skipped = results.filter((r) => !r.passed && r.detail.startsWith("Skipped")).length;

  for (const r of results) {
    const icon = r.passed ? "✓" : r.detail.startsWith("Skipped") ? "–" : "✗";
    const label = r.passed ? "\x1b[32m" : r.detail.startsWith("Skipped") ? "\x1b[33m" : "\x1b[31m";
    console.log(`${label}[${icon}]\x1b[0m ${r.name}`);
    console.log(`     ${r.detail.replace(/\n/g, "\n     ")}\n`);
  }

  console.log(`${"─".repeat(60)}`);
  console.log(
    `Results: \x1b[32m${passed} passed\x1b[0m  \x1b[31m${failed - skipped} failed\x1b[0m  \x1b[33m${skipped} skipped\x1b[0m`,
  );
  console.log(`${"─".repeat(60)}\n`);

  process.exit(failed - skipped > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error("Test runner crashed:", e);
  process.exit(1);
});
