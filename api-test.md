# 🚀 API Reference & Testing Guide

This document lists all **API Endpoints** built in the application up to **Day
10** with request specifications, parameters, cURL commands, and expected JSON
responses.

---

## 📌 Base URL

```
http://localhost:3000
```

---

## 🔑 Authentication & Multi-Tenancy in Postman

You have **two options** to authenticate requests in Postman:

### Option A: Using `tenantId` Query Parameter (Easiest — No Cookies Required)

All tool endpoints support bypassing browser authentication by passing
`tenantId`:

- **Query Parameter:** `tenantId=YOUR_TENANT_ID`
- **Example in Postman:**
  `http://localhost:3000/api/user/tools-test?tool=repos&tenantId=3c9a10f5-813f-447e-ba26-83ca4a8df2ad`

### Option B: Using Session Cookie in Postman

#### 1. How to get your `better-auth.session_token`:

1. Open your browser and log in at `http://localhost:3000`.
2. Open **Developer Tools** (`F12` or right-click -> Inspect).
3. Go to **Application** tab ➔ **Cookies** ➔ `http://localhost:3000`.
4. Copy the Value of the `better-auth.session_token` cookie.

#### 2. How to set it in Postman:

- In Postman, open the **Headers** tab for your request.
- Add Key: `Cookie`
- Add Value: `better-auth.session_token=YOUR_COPIED_TOKEN_HERE`

---

## 📑 API Endpoint Index

1. [`GET /api/user/tenant-status`](#1-get-apiusertenant-status) — Check tenant
   setup and Corsair client status
2. [`GET /api/user/backfill`](#2-get-apiuserbackfill) — Check database synced
   entity counts
3. [`POST /api/user/backfill`](#3-post-apiuserbackfill) — Manually trigger
   tenant data backfill
4. [`GET /api/user/test-sync`](#4-get-apiusertest-sync) — Test live GitHub API
   vs. synced DB entities
5. [`POST /api/webhooks`](#5-post-apiwebhooks) — Live GitHub webhook listener
6. [`GET /api/user/tools-test?tool=repositories`](#6-get-apiusertools-testtoolrepositories)
   — Read Tool: Connected Repositories
7. [`GET /api/user/tools-test?tool=branches`](#7-get-apiusertools-testtoolbranches)
   — Read Tool: Branches
8. [`GET /api/user/tools-test?tool=commits`](#8-get-apiusertools-testtoolcommits)
   — Read Tool: Commits
9. [`GET /api/user/tools-test?tool=prs`](#9-get-apiusertools-testtoolprs) — Read
   Tool: Pull Requests
10. [`GET /api/user/tools-test?tool=issues`](#10-get-apiusertools-testtoolissues)
    — Read Tool: Issues
11. [`GET /api/user/tools-test?tool=file-content`](#11-get-apiusertools-testtoolfile-content)
    — Live Tool: Uncached File Content
12. [`GET /api/user/tools-test?tool=create-issue`](#12-get-apiusertools-testtoolcreate-issue)
    — Write Tool: Live Issue Creation

---

## 📡 Detailed API Endpoints

### 1. `GET /api/user/tenant-status`

**Description:** Checks if the user is authenticated, retrieves their
`corsairTenantId` from PostgreSQL, and verifies that the Corsair GitHub API
client is ready.

- **Method:** `GET`
- **Authentication:** Required (Session Cookie)

#### Request Example:

```bash
curl -X GET http://localhost:3000/api/user/tenant-status \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN"
```

#### Expected Success Response (`200 OK`):

```json
{
  "authenticated": true,
  "tenantProvisioned": true,
  "corsairTenantId": "3c9a10f5-813f-447e-ba26-83ca4a8df2ad",
  "corsairSuccess": true,
  "corsairError": null,
  "reposSample": [
    {
      "id": 1306894677,
      "name": "OpenStack",
      "fullName": "therajarshichakraborty/OpenStack",
      "private": false
    }
  ]
}
```

#### Expected Error Response (`401 Unauthorized`):

```json
{
  "error": "Unauthorized",
  "authenticated": false
}
```

---

### 2. `GET /api/user/backfill`

**Description:** Queries `corsair_entities` table in PostgreSQL to return counts
of all synced GitHub entities for the authenticated tenant.

- **Method:** `GET`
- **Authentication:** Required (Session Cookie)

#### Request Example:

```bash
curl -X GET http://localhost:3000/api/user/backfill
```

#### Expected Success Response (`200 OK`):

```json
{
  "authenticated": true,
  "tenantProvisioned": true,
  "tenantId": "3c9a10f5-813f-447e-ba26-83ca4a8df2ad",
  "entityCounts": [
    { "entity_type": "repositories", "count": 5 },
    { "entity_type": "branches", "count": 18 },
    { "entity_type": "pullRequests", "count": 12 },
    { "entity_type": "issues", "count": 8 }
  ]
}
```

---

### 3. `POST /api/user/backfill`

**Description:** Triggers Corsair's setup and initial backfill process to fetch
and save all repositories, branches, issues, and PRs into PostgreSQL.

- **Method:** `POST`
- **Authentication:** Required (Session Cookie)

#### Request Example:

```bash
curl -X POST http://localhost:3000/api/user/backfill
```

#### Expected Success Response (`200 OK`):

```json
{
  "success": true,
  "tenantId": "3c9a10f5-813f-447e-ba26-83ca4a8df2ad",
  "setupOutput": { "completed": true },
  "entityCounts": [
    { "entity_type": "repositories", "count": 5 },
    { "entity_type": "branches", "count": 18 },
    { "entity_type": "pullRequests", "count": 12 },
    { "entity_type": "issues", "count": 8 }
  ]
}
```

---

### 4. `GET /api/user/test-sync`

**Description:** Compares live API data directly against local database synced
entities in PostgreSQL (`corsair_entities`).

- **Method:** `GET`
- **Authentication:** Required (Session Cookie)

#### Request Example:

```bash
curl -X GET http://localhost:3000/api/user/test-sync
```

#### Expected Success Response (`200 OK`):

```json
{
  "success": true,
  "tenantId": "3c9a10f5-813f-447e-ba26-83ca4a8df2ad",
  "targetRepo": {
    "owner": "therajarshichakraborty",
    "repo": "OpenStack"
  },
  "apiError": null,
  "liveApiCounts": {
    "repositories": 5,
    "branches": 4,
    "commits": 10,
    "pullRequests": 2,
    "issues": 3
  },
  "dbSyncedEntities": {
    "total": 43,
    "byType": {
      "repositories": 5,
      "branches": 18,
      "pullRequests": 12,
      "issues": 8
    }
  }
}
```

---

### 5. `POST /api/webhooks`

**Description:** Public webhook route that receives real-time events (pushes,
issues, pull requests) from GitHub webhooks and processes them into Corsair.

- **Method:** `POST`
- **Authentication:** None (Validates GitHub signature headers)
- **Request Body:** Standard GitHub Webhook JSON Event payload

#### Request Example:

```bash
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{"ref": "refs/heads/main", "repository": {"full_name": "owner/repo"}}'
```

#### Expected Success Response (`200 OK`):

```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

---

### 6. `GET /api/user/tools-test?tool=repositories`

**Description:** Read tool listing all connected GitHub repositories. (Uses
local DB as primary lookup, fallback to live API proxy).

- **Method:** `GET`
- **Query Parameters:**
  - `tool`: `repositories` or `repos` (Required)
  - `perPage`: optional integer (default: 30)
  - `tenantId`: optional override tenant string

#### Request Example:

```bash
curl -X GET "http://localhost:3000/api/user/tools-test?tool=repositories"
```

#### Expected Success Response (`200 OK`):

```json
{
  "tool": "repositories",
  "success": true,
  "source": "synced_db",
  "count": 2,
  "repositories": [
    {
      "id": 1306894677,
      "name": "OpenStack",
      "fullName": "therajarshichakraborty/OpenStack",
      "private": false,
      "language": "TypeScript"
    }
  ]
}
```

---

### 7. `GET /api/user/tools-test?tool=branches`

**Description:** Read tool fetching branches for a target repository.

- **Method:** `GET`
- **Query Parameters:**
  - `tool`: `branches` (Required)
  - `owner`: GitHub username/org (Required)
  - `repo`: Repository name (Required)
  - `tenantId`: optional override string

#### Request Example:

```bash
curl -X GET "http://localhost:3000/api/user/tools-test?tool=branches&owner=therajarshichakraborty&repo=OpenStack"
```

#### Expected Success Response (`200 OK`):

```json
{
  "tool": "branches",
  "success": true,
  "source": "synced_db",
  "owner": "therajarshichakraborty",
  "repo": "OpenStack",
  "count": 2,
  "branches": [
    {
      "name": "main",
      "protected": false,
      "sha": "a1b2c3d4e5f6..."
    }
  ]
}
```

---

### 8. `GET /api/user/tools-test?tool=commits`

**Description:** Read tool fetching commits for a repository via live API proxy.

- **Method:** `GET`
- **Query Parameters:**
  - `tool`: `commits` (Required)
  - `owner`: GitHub username/org (Required)
  - `repo`: Repository name (Required)
  - `perPage`: optional integer (default: 30)

#### Request Example:

```bash
curl -X GET "http://localhost:3000/api/user/tools-test?tool=commits&owner=therajarshichakraborty&repo=OpenStack"
```

#### Expected Success Response (`200 OK`):

```json
{
  "tool": "commits",
  "success": true,
  "source": "live_api",
  "owner": "therajarshichakraborty",
  "repo": "OpenStack",
  "count": 5,
  "commits": [
    {
      "sha": "9f8e7d6c5b4a321...",
      "commit": {
        "message": "feat(tools): implement Day 10 tools",
        "author": {
          "name": "Rajarshi Chakraborty",
          "date": "2026-07-28T19:00:00Z"
        }
      }
    }
  ]
}
```

---

### 9. `GET /api/user/tools-test?tool=prs`

**Description:** Read tool retrieving pull requests filtered by state.

- **Method:** `GET`
- **Query Parameters:**
  - `tool`: `prs` or `pull-requests` (Required)
  - `owner`: GitHub username/org (Required)
  - `repo`: Repository name (Required)
  - `state`: `open` | `closed` | `all` (default: `all`)

#### Request Example:

```bash
curl -X GET "http://localhost:3000/api/user/tools-test?tool=prs&owner=therajarshichakraborty&repo=OpenStack&state=all"
```

#### Expected Success Response (`200 OK`):

```json
{
  "tool": "prs",
  "success": true,
  "source": "synced_db",
  "owner": "therajarshichakraborty",
  "repo": "OpenStack",
  "state": "all",
  "count": 1,
  "pullRequests": [
    {
      "id": 501,
      "number": 1,
      "title": "Add feature X",
      "state": "closed"
    }
  ]
}
```

---

### 10. `GET /api/user/tools-test?tool=issues`

**Description:** Read tool retrieving repository issues filtered by state.

- **Method:** `GET`
- **Query Parameters:**
  - `tool`: `issues` (Required)
  - `owner`: GitHub username/org (Required)
  - `repo`: Repository name (Required)
  - `state`: `open` | `closed` | `all` (default: `all`)

#### Request Example:

```bash
curl -X GET "http://localhost:3000/api/user/tools-test?tool=issues&owner=therajarshichakraborty&repo=OpenStack&state=all"
```

#### Expected Success Response (`200 OK`):

```json
{
  "tool": "issues",
  "success": true,
  "source": "synced_db",
  "owner": "therajarshichakraborty",
  "repo": "OpenStack",
  "state": "all",
  "count": 2,
  "issues": [
    {
      "id": 801,
      "number": 1,
      "title": "Bug in login flow",
      "state": "open"
    }
  ]
}
```

---

### 11. `GET /api/user/tools-test?tool=file-content`

**Description:** Live uncached read tool fetching raw file content directly from
GitHub API and decoding base64 payloads to UTF-8.

- **Method:** `GET`
- **Query Parameters:**
  - `tool`: `file-content` or `file` (Required)
  - `owner`: GitHub username/org (Required)
  - `repo`: Repository name (Required)
  - `path`: File path inside repository (Required, e.g. `package.json` or
    `README.md`)
  - `ref`: optional branch/commit (default: `default`)

#### Request Example:

```bash
curl -X GET "http://localhost:3000/api/user/tools-test?tool=file-content&owner=therajarshichakraborty&repo=OpenStack&path=package.json"
```

#### Expected Success Response (`200 OK`):

```json
{
  "tool": "file-content",
  "success": true,
  "source": "live_api",
  "owner": "therajarshichakraborty",
  "repo": "OpenStack",
  "path": "package.json",
  "ref": "default",
  "type": "file",
  "name": "package.json",
  "sha": "b2c3d4e5...",
  "size": 1240,
  "encoding": "base64",
  "downloadUrl": "https://raw.githubusercontent.com/therajarshichakraborty/OpenStack/main/package.json",
  "htmlUrl": "https://github.com/therajarshichakraborty/OpenStack/blob/main/package.json",
  "publicUrl": "https://github.com/therajarshichakraborty/OpenStack/blob/main/package.json",
  "content": "{\n  \"name\": \"openstack\",\n  \"version\": \"1.0.0\"\n}"
}
```

---

### 12. `GET /api/user/tools-test?tool=create-issue`

**Description:** Live write tool executing issue creation directly on GitHub
repository via live proxy.

- **Method:** `GET` (or function call)
- **Query Parameters:**
  - `tool`: `create-issue` (Required)
  - `owner`: GitHub username/org (Required)
  - `repo`: Repository name (Required)
  - `title`: Issue title string (Required)
  - `body`: optional issue body markdown string
  - `labels`: optional comma-separated labels (e.g. `bug,documentation`)

#### Request Example:

```bash
curl -X GET "http://localhost:3000/api/user/tools-test?tool=create-issue&owner=therajarshichakraborty&repo=OpenStack&title=Day+10+Test+Issue&body=Issue+created+via+Live+Write+API"
```

#### Expected Success Response (`200 OK`):

```json
{
  "tool": "create-issue",
  "success": true,
  "action": "created_issue",
  "owner": "therajarshichakraborty",
  "repo": "OpenStack",
  "issue": {
    "id": 298765432,
    "number": 5,
    "title": "Day 10 Test Issue",
    "body": "Issue created via Live Write API",
    "state": "open",
    "htmlUrl": "https://github.com/therajarshichakraborty/OpenStack/issues/5",
    "publicUrl": "https://github.com/therajarshichakraborty/OpenStack/issues/5",
    "createdAt": "2026-07-28T19:15:00Z"
  }
}
```

---

## 🛠️ Command Line Testing Script

You can also run the CLI script directly to test all 7 tools sequentially
against PostgreSQL and GitHub API:

```bash
# Test all read & uncached live file tools:
bun run scripts/test-tools.ts

# Test live write issue creation:
bun run scripts/test-tools.ts --write
```
