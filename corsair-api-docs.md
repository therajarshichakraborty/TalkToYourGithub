Documentation Index
Fetch the complete documentation index at: /llms.txt

Use this file to discover all available pages before exploring further.

Skip to main content

Search...
Ctrl K
corsairdev/corsair
6,135

Docs
Plugins
Guides
Overview
Plugins
Build a Plugin
Plugins

AgentQL

Ahrefs

Airtable

Amplitude

Asana

Bitwarden

Bluesky

Box

Cal.com

Calendly

Cloudflare

Cursor

Discord

Dodo Payments

Dropbox

Exa

Figma

Firecrawl

Fireflies

Github
Overview
Get Credentials
API
Database
Webhooks

Gitlab

Gmail

Google calendar

Google Docs

Google drive

Google Meet

Google sheets

Grafana

Hacker news

Hubspot

Instagram

Intercom

Jira

Linear

LinkedIn

Microsoft Teams

Monday

Neon

Notion

Onedrive

Open Weather Map

Oura

Outlook

Pagerduty

Posthog

Razorpay

Reddit

Resend

Sentry

Sharepoint

Slack

Spotify

Strava

Stripe

Supabase

Tally

Tavily

Telegram

Todoist

Trello

Twilio

Twitter

TwitterAPI.io

Typeform

Vapi

Vercel

Xquik

Youtube

Zendesk

Zoho Mail

Zoom

On this page
Comments
delete
get
list
listForIssue
update
Discussions
get
list
Events
list
listForNetwork
listForOrg
listForRepository
listForUser
listForUserOrg
listPublicForUser
listPublicReceivedForUser
listReceivedForUser
Forks
list
Issues
create
createComment
get
list
update
Pull Requests
createReview
get
list
listReviews
Releases
create
get
list
update
Repositories
checkStarred
get
getContent
list
listBranches
listCommits
listStarred
star
unstar
Users
get
getAuthenticated
getById
getHovercard
list
update
Workflows
get
list
listRuns
Github
API
API reference for Github: every github.api.* operation with input and output types.

Every github.api.* operation is listed below with parameter shapes and return types from the plugin Zod schemas.
New to Corsair? See API access, authentication, and error handling.
​
Comments
​
delete
comments.delete
Delete a comment
Risk: write
await corsair.github.api.comments.delete({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
commentId	number	Yes	—
Output: void
​
get
comments.get
Get a specific comment
Risk: read
await corsair.github.api.comments.get({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
commentId	number	Yes	—
Output
Name	Type	Required	Description
id	number	Yes	—
nodeId	string	No	—
url	string	No	—
htmlUrl	string	No	—
issueUrl	string	No	—
body	string	No	—
authorAssociation	string	No	—
createdAt	Date	No	—
updatedAt	Date	No	—
​
list
comments.list
List all comments in a repository
Risk: read
await corsair.github.api.comments.list({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
sort	created | updated	No	—
direction	asc | desc	No	—
since	string	No	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
listForIssue
comments.listForIssue
List comments on a specific issue or pull request
Risk: read
await corsair.github.api.comments.listForIssue({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
issueNumber	number	Yes	—
since	string	No	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
update
comments.update
Update a comment
Risk: write
await corsair.github.api.comments.update({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
commentId	number	Yes	—
body	string	Yes	—
Output
Name	Type	Required	Description
id	number	Yes	—
nodeId	string	No	—
url	string	No	—
htmlUrl	string	No	—
issueUrl	string	No	—
body	string	No	—
authorAssociation	string	No	—
createdAt	Date	No	—
updatedAt	Date	No	—
​
Discussions
​
get
discussions.get
Get a specific discussion
Risk: read
await corsair.github.api.discussions.get({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
discussionNumber	number	Yes	—
Output
Name	Type	Required	Description
id	number	Yes	—
nodeId	string	No	—
number	number	Yes	—
title	string	Yes	—
body	string	No	—
htmlUrl	string	No	—
repositoryUrl	string	No	—
state	string	No	—
locked	boolean	No	—
comments	number	No	—
authorAssociation	string	No	—
category	object	No	—
createdAt	Date	No	—
updatedAt	Date	No	—
answerChosenAt	Date	No	—
category full type

​
list
discussions.list
List discussions in a repository
Risk: read
await corsair.github.api.discussions.list({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
Events
​
list
events.list
List public GitHub events
Risk: read
await corsair.github.api.events.list({});
Input
Name	Type	Required	Description
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
listForNetwork
events.listForNetwork
List public events for a repository network
Risk: read
await corsair.github.api.events.listForNetwork({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
listForOrg
events.listForOrg
List public events for an organization
Risk: read
await corsair.github.api.events.listForOrg({});
Input
Name	Type	Required	Description
org	string	Yes	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
listForRepository
events.listForRepository
List events for a repository
Risk: read
await corsair.github.api.events.listForRepository({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
listForUser
events.listForUser
List events for a user
Risk: read
await corsair.github.api.events.listForUser({});
Input
Name	Type	Required	Description
username	string	Yes	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
listForUserOrg
events.listForUserOrg
List organization events for a user
Risk: read
await corsair.github.api.events.listForUserOrg({});
Input
Name	Type	Required	Description
username	string	Yes	—
org	string	Yes	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
listPublicForUser
events.listPublicForUser
List public events for a user
Risk: read
await corsair.github.api.events.listPublicForUser({});
Input
Name	Type	Required	Description
username	string	Yes	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
listPublicReceivedForUser
events.listPublicReceivedForUser
List public events received by a user
Risk: read
await corsair.github.api.events.listPublicReceivedForUser({});
Input
Name	Type	Required	Description
username	string	Yes	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
listReceivedForUser
events.listReceivedForUser
List events received by a user
Risk: read
await corsair.github.api.events.listReceivedForUser({});
Input
Name	Type	Required	Description
username	string	Yes	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
Forks
​
list
forks.list
List forks of a repository
Risk: read
await corsair.github.api.forks.list({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
sort	newest | oldest | stargazers | watchers	No	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
Issues
​
create
issues.create
Create a new issue
Risk: write
await corsair.github.api.issues.create({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
title	string | number	Yes	—
body	string	No	—
assignee	string	No	—
milestone	string | number	No	—
labels	object[]	No	—
assignees	string[]	No	—
labels full type

Output
Name	Type	Required	Description
id	number	Yes	—
nodeId	string	No	—
url	string	No	—
repositoryUrl	string	No	—
labelsUrl	string	No	—
commentsUrl	string	No	—
eventsUrl	string	No	—
htmlUrl	string	No	—
number	number	Yes	—
state	string	Yes	—
stateReason	completed | reopened | not_planned | duplicate	No	—
title	string	Yes	—
body	string	No	—
user	object	No	—
labels	object[]	No	—
assignee	object	No	—
assignees	object[]	No	—
locked	boolean	No	—
comments	number	No	—
createdAt	Date	No	—
updatedAt	Date	No	—
closedAt	Date	No	—
user full type

labels full type

assignee full type

assignees full type

​
createComment
issues.createComment
Post a comment on an issue
Risk: write
await corsair.github.api.issues.createComment({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
issueNumber	number	Yes	—
body	string	Yes	—
Output
Name	Type	Required	Description
id	number	Yes	—
nodeId	string	No	—
url	string	No	—
body	string	No	—
bodyText	string	No	—
bodyHtml	string	No	—
htmlUrl	string	No	—
user	object	No	—
createdAt	Date	No	—
updatedAt	Date	No	—
issueUrl	string	No	—
user full type

​
get
issues.get
Get a specific issue
Risk: read
await corsair.github.api.issues.get({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
issueNumber	number	Yes	—
Output
Name	Type	Required	Description
id	number	Yes	—
nodeId	string	No	—
url	string	No	—
repositoryUrl	string	No	—
labelsUrl	string	No	—
commentsUrl	string	No	—
eventsUrl	string	No	—
htmlUrl	string	No	—
number	number	Yes	—
state	string	Yes	—
stateReason	completed | reopened | not_planned | duplicate	No	—
title	string	Yes	—
body	string	No	—
user	object	No	—
labels	object[]	No	—
assignee	object	No	—
assignees	object[]	No	—
locked	boolean	No	—
comments	number	No	—
createdAt	Date	No	—
updatedAt	Date	No	—
closedAt	Date	No	—
user full type

labels full type

assignee full type

assignees full type

​
list
issues.list
List issues in a repository
Risk: read
await corsair.github.api.issues.list({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
milestone	string	No	—
state	open | closed | all	No	—
assignee	string	No	—
creator	string	No	—
mentioned	string	No	—
labels	string	No	—
sort	created | updated | comments	No	—
direction	asc | desc	No	—
since	string	No	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
update
issues.update
Update an existing issue
Risk: write
await corsair.github.api.issues.update({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
issueNumber	number	Yes	—
title	string | number	No	—
body	string	No	—
assignee	string	No	—
state	open | closed	No	—
stateReason	completed | not_planned | duplicate | reopened	No	—
milestone	string | number	No	—
labels	object[]	No	—
assignees	string[]	No	—
labels full type

Output
Name	Type	Required	Description
id	number	Yes	—
nodeId	string	No	—
url	string	No	—
repositoryUrl	string	No	—
labelsUrl	string	No	—
commentsUrl	string	No	—
eventsUrl	string	No	—
htmlUrl	string	No	—
number	number	Yes	—
state	string	Yes	—
stateReason	completed | reopened | not_planned | duplicate	No	—
title	string	Yes	—
body	string	No	—
user	object	No	—
labels	object[]	No	—
assignee	object	No	—
assignees	object[]	No	—
locked	boolean	No	—
comments	number	No	—
createdAt	Date	No	—
updatedAt	Date	No	—
closedAt	Date	No	—
user full type

labels full type

assignee full type

assignees full type

​
Pull Requests
​
createReview
pullRequests.createReview
Submit a pull request review
Risk: write
await corsair.github.api.pullRequests.createReview({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
pullNumber	number	Yes	—
commitId	string	No	—
body	string	No	—
event	APPROVE | REQUEST_CHANGES | COMMENT	No	—
comments	object[]	No	—
comments full type

Output
Name	Type	Required	Description
id	number	Yes	—
nodeId	string	No	—
user	object	No	—
body	string	No	—
state	string	No	—
htmlUrl	string	No	—
pullRequestUrl	string	No	—
submittedAt	Date	No	—
commitId	string	No	—
user full type

​
get
pullRequests.get
Get a specific pull request
Risk: read
await corsair.github.api.pullRequests.get({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
pullNumber	number	Yes	—
Output
Name	Type	Required	Description
url	string	Yes	—
id	number	Yes	—
nodeId	string	No	—
htmlUrl	string	No	—
diffUrl	string	No	—
patchUrl	string	No	—
issueUrl	string	No	—
number	number	Yes	—
state	open | closed	Yes	—
locked	boolean	No	—
title	string	Yes	—
user	object	No	—
body	string	No	—
createdAt	Date	No	—
updatedAt	Date	No	—
closedAt	Date	No	—
mergedAt	Date	No	—
mergeCommitSha	string	No	—
assignee	object	No	—
assignees	object[]	No	—
labels	object[]	No	—
milestone	object	No	—
commitsUrl	string	No	—
reviewCommentsUrl	string	No	—
reviewCommentUrl	string	No	—
commentsUrl	string	No	—
statusesUrl	string	No	—
head	object	No	—
base	object	No	—
authorAssociation	string	No	—
draft	boolean	No	—
merged	boolean	No	—
mergeable	boolean	No	—
comments	number	No	—
reviewComments	number	No	—
commits	number	No	—
additions	number	No	—
deletions	number	No	—
changedFiles	number	No	—
user full type

assignee full type

assignees full type

labels full type

milestone full type

head full type

base full type

​
list
pullRequests.list
List pull requests
Risk: read
await corsair.github.api.pullRequests.list({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
state	open | closed | all	No	—
head	string	No	—
base	string	No	—
sort	created | updated | popularity | long-running	No	—
direction	asc | desc	No	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
listReviews
pullRequests.listReviews
List reviews on a pull request
Risk: read
await corsair.github.api.pullRequests.listReviews({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
pullNumber	number	Yes	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
Releases
​
create
releases.create
Create a new release
Risk: write
await corsair.github.api.releases.create({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
tagName	string	Yes	—
targetCommitish	string	No	—
name	string	No	—
body	string	No	—
draft	boolean	No	—
prerelease	boolean	No	—
generateReleaseNotes	boolean	No	—
Output
Name	Type	Required	Description
url	string	No	—
htmlUrl	string	No	—
assetsUrl	string	No	—
uploadUrl	string	No	—
tarballUrl	string	No	—
zipballUrl	string	No	—
id	number	Yes	—
nodeId	string	No	—
tagName	string	No	—
targetCommitish	string	No	—
name	string	No	—
body	string	No	—
draft	boolean	No	—
prerelease	boolean	No	—
createdAt	Date	No	—
publishedAt	Date	No	—
author	object	No	—
assets	object[]	No	—
author full type

assets full type

​
get
releases.get
Get a specific release
Risk: read
await corsair.github.api.releases.get({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
releaseId	number	Yes	—
Output
Name	Type	Required	Description
url	string	No	—
htmlUrl	string	No	—
assetsUrl	string	No	—
uploadUrl	string	No	—
tarballUrl	string	No	—
zipballUrl	string	No	—
id	number	Yes	—
nodeId	string	No	—
tagName	string	No	—
targetCommitish	string	No	—
name	string	No	—
body	string	No	—
draft	boolean	No	—
prerelease	boolean	No	—
createdAt	Date	No	—
publishedAt	Date	No	—
author	object	No	—
assets	object[]	No	—
author full type

assets full type

​
list
releases.list
List releases in a repository
Risk: read
await corsair.github.api.releases.list({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
update
releases.update
Update an existing release
Risk: write
await corsair.github.api.releases.update({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
releaseId	number	Yes	—
tagName	string	No	—
targetCommitish	string	No	—
name	string	No	—
body	string	No	—
draft	boolean	No	—
prerelease	boolean	No	—
Output
Name	Type	Required	Description
url	string	No	—
htmlUrl	string	No	—
assetsUrl	string	No	—
uploadUrl	string	No	—
tarballUrl	string	No	—
zipballUrl	string	No	—
id	number	Yes	—
nodeId	string	No	—
tagName	string	No	—
targetCommitish	string	No	—
name	string	No	—
body	string	No	—
draft	boolean	No	—
prerelease	boolean	No	—
createdAt	Date	No	—
publishedAt	Date	No	—
author	object	No	—
assets	object[]	No	—
author full type

assets full type

​
Repositories
​
checkStarred
repositories.checkStarred
Check whether the authenticated user has starred a repository
Risk: read
await corsair.github.api.repositories.checkStarred({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
Output
Name	Type	Required	Description
starred	boolean	Yes	—
​
get
repositories.get
Get a specific repository
Risk: read
await corsair.github.api.repositories.get({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
Output
Name	Type	Required	Description
id	number	Yes	—
nodeId	string	No	—
name	string	Yes	—
fullName	string	No	—
private	boolean	No	—
htmlUrl	string	No	—
description	string	No	—
fork	boolean	No	—
url	string	No	—
createdAt	Date	No	—
updatedAt	Date	No	—
pushedAt	Date	No	—
defaultBranch	string	No	—
language	string	No	—
stargazersCount	number	No	—
watchersCount	number	No	—
forksCount	number	No	—
openIssuesCount	number	No	—
archived	boolean	No	—
disabled	boolean	No	—
owner	object	No	—
owner full type

​
getContent
repositories.getContent
Get file or directory content from a repository
Risk: read
await corsair.github.api.repositories.getContent({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
path	string	Yes	—
ref	string	No	—
Output: object[]
Output full type

​
list
repositories.list
List repositories for the authenticated user
Risk: read
await corsair.github.api.repositories.list({});
Input
Name	Type	Required	Description
owner	string	No	—
type	all | owner | public | private | member	No	—
sort	created | updated | pushed | full_name	No	—
direction	asc | desc	No	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
listBranches
repositories.listBranches
List branches in a repository
Risk: read
await corsair.github.api.repositories.listBranches({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
protected	boolean	No	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
listCommits
repositories.listCommits
List commits in a repository
Risk: read
await corsair.github.api.repositories.listCommits({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
sha	string	No	—
path	string	No	—
author	string	No	—
committer	string	No	—
since	string	No	—
until	string	No	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
listStarred
repositories.listStarred
List repositories starred by the authenticated user
Risk: read
await corsair.github.api.repositories.listStarred({});
Input
Name	Type	Required	Description
sort	created | updated	No	—
direction	asc | desc	No	—
perPage	number	No	—
page	number	No	—
Output: object[]
Output full type

​
star
repositories.star
Star a repository for the authenticated user
Risk: write
await corsair.github.api.repositories.star({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
Output: boolean
​
unstar
repositories.unstar
Unstar a repository for the authenticated user
Risk: write
await corsair.github.api.repositories.unstar({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
Output: boolean
​
Users
​
get
users.get
Get a user by username
Risk: read
await corsair.github.api.users.get({});
Input
Name	Type	Required	Description
username	string	Yes	—
Output
Name	Type	Required	Description
name	string	No	—
email	string	No	—
login	string	Yes	—
id	number	Yes	—
nodeId	string	No	—
avatarUrl	string	No	—
gravatarId	string	No	—
url	string	No	—
htmlUrl	string	No	—
followersUrl	string	No	—
followingUrl	string	No	—
gistsUrl	string	No	—
starredUrl	string	No	—
subscriptionsUrl	string	No	—
organizationsUrl	string	No	—
reposUrl	string	No	—
eventsUrl	string	No	—
receivedEventsUrl	string	No	—
type	string	No	—
siteAdmin	boolean	No	—
starredAt	Date	No	—
userViewType	string	No	—
company	string	No	—
blog	string	No	—
location	string	No	—
notificationEmail	string	No	—
hireable	boolean	No	—
bio	string	No	—
twitterUsername	string	No	—
publicRepos	number	No	—
publicGists	number	No	—
followers	number	No	—
following	number	No	—
createdAt	Date	No	—
updatedAt	Date	No	—
privateGists	number	No	—
totalPrivateRepos	number	No	—
ownedPrivateRepos	number	No	—
diskUsage	number	No	—
collaborators	number	No	—
twoFactorAuthentication	boolean	No	—
plan	object	No	—
businessPlus	boolean	No	—
ldapDn	string	No	—
plan full type

​
getAuthenticated
users.getAuthenticated
Get the authenticated user
Risk: read
await corsair.github.api.users.getAuthenticated({});
Input: empty object
Output
Name	Type	Required	Description
name	string	No	—
email	string	No	—
login	string	Yes	—
id	number	Yes	—
nodeId	string	No	—
avatarUrl	string	No	—
gravatarId	string	No	—
url	string	No	—
htmlUrl	string	No	—
followersUrl	string	No	—
followingUrl	string	No	—
gistsUrl	string	No	—
starredUrl	string	No	—
subscriptionsUrl	string	No	—
organizationsUrl	string	No	—
reposUrl	string	No	—
eventsUrl	string	No	—
receivedEventsUrl	string	No	—
type	string	No	—
siteAdmin	boolean	No	—
starredAt	Date	No	—
userViewType	string	No	—
company	string	No	—
blog	string	No	—
location	string	No	—
notificationEmail	string	No	—
hireable	boolean	No	—
bio	string	No	—
twitterUsername	string	No	—
publicRepos	number	No	—
publicGists	number	No	—
followers	number	No	—
following	number	No	—
createdAt	Date	No	—
updatedAt	Date	No	—
privateGists	number	No	—
totalPrivateRepos	number	No	—
ownedPrivateRepos	number	No	—
diskUsage	number	No	—
collaborators	number	No	—
twoFactorAuthentication	boolean	No	—
plan	object	No	—
businessPlus	boolean	No	—
ldapDn	string	No	—
plan full type

​
getById
users.getById
Get a user by account ID
Risk: read
await corsair.github.api.users.getById({});
Input
Name	Type	Required	Description
accountId	number	Yes	—
Output
Name	Type	Required	Description
name	string	No	—
email	string	No	—
login	string	Yes	—
id	number	Yes	—
nodeId	string	No	—
avatarUrl	string	No	—
gravatarId	string	No	—
url	string	No	—
htmlUrl	string	No	—
followersUrl	string	No	—
followingUrl	string	No	—
gistsUrl	string	No	—
starredUrl	string	No	—
subscriptionsUrl	string	No	—
organizationsUrl	string	No	—
reposUrl	string	No	—
eventsUrl	string	No	—
receivedEventsUrl	string	No	—
type	string	No	—
siteAdmin	boolean	No	—
starredAt	Date	No	—
userViewType	string	No	—
company	string	No	—
blog	string	No	—
location	string	No	—
notificationEmail	string	No	—
hireable	boolean	No	—
bio	string	No	—
twitterUsername	string	No	—
publicRepos	number	No	—
publicGists	number	No	—
followers	number	No	—
following	number	No	—
createdAt	Date	No	—
updatedAt	Date	No	—
privateGists	number	No	—
totalPrivateRepos	number	No	—
ownedPrivateRepos	number	No	—
diskUsage	number	No	—
collaborators	number	No	—
twoFactorAuthentication	boolean	No	—
plan	object	No	—
businessPlus	boolean	No	—
ldapDn	string	No	—
plan full type

​
getHovercard
users.getHovercard
Get contextual hovercard information for a user
Risk: read
await corsair.github.api.users.getHovercard({});
Input
Name	Type	Required	Description
username	string	Yes	—
subjectType	organization | repository | issue | pull_request	No	—
subjectId	string	No	—
Output
Name	Type	Required	Description
contexts	object[]	Yes	—
contexts full type

​
list
users.list
List all GitHub users
Risk: read
await corsair.github.api.users.list({});
Input
Name	Type	Required	Description
since	number	No	—
perPage	number	No	—
Output: object[]
Output full type

​
update
users.update
Update the authenticated user profile
Risk: write
await corsair.github.api.users.update({});
Input
Name	Type	Required	Description
name	string	No	—
email	string	No	—
blog	string	No	—
twitterUsername	string	No	—
company	string	No	—
location	string	No	—
hireable	boolean	No	—
bio	string	No	—
Output
Name	Type	Required	Description
name	string	No	—
email	string	No	—
login	string	Yes	—
id	number	Yes	—
nodeId	string	No	—
avatarUrl	string	No	—
gravatarId	string	No	—
url	string	No	—
htmlUrl	string	No	—
followersUrl	string	No	—
followingUrl	string	No	—
gistsUrl	string	No	—
starredUrl	string	No	—
subscriptionsUrl	string	No	—
organizationsUrl	string	No	—
reposUrl	string	No	—
eventsUrl	string	No	—
receivedEventsUrl	string	No	—
type	string	No	—
siteAdmin	boolean	No	—
starredAt	Date	No	—
userViewType	string	No	—
company	string	No	—
blog	string	No	—
location	string	No	—
notificationEmail	string	No	—
hireable	boolean	No	—
bio	string	No	—
twitterUsername	string	No	—
publicRepos	number	No	—
publicGists	number	No	—
followers	number	No	—
following	number	No	—
createdAt	Date	No	—
updatedAt	Date	No	—
privateGists	number	No	—
totalPrivateRepos	number	No	—
ownedPrivateRepos	number	No	—
diskUsage	number	No	—
collaborators	number	No	—
twoFactorAuthentication	boolean	No	—
plan	object	No	—
businessPlus	boolean	No	—
ldapDn	string	No	—
plan full type

​
Workflows
​
get
workflows.get
Get a specific workflow
Risk: read
await corsair.github.api.workflows.get({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
workflowId	number | string	Yes	—
Output
Name	Type	Required	Description
id	number	Yes	—
nodeId	string	No	—
name	string	Yes	—
path	string	Yes	—
state	active | deleted | disabled_fork | disabled_inactivity | disabled_manually	Yes	—
createdAt	Date	No	—
updatedAt	Date	No	—
url	string	No	—
htmlUrl	string	No	—
badgeUrl	string	No	—
deletedAt	Date	No	—
​
list
workflows.list
List workflows in a repository
Risk: read
await corsair.github.api.workflows.list({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
perPage	number	No	—
page	number	No	—
Output
Name	Type	Required	Description
totalCount	number	No	—
total_count	number	No	—
workflows	object[]	No	—
workflows full type

​
listRuns
workflows.listRuns
List workflow runs
Risk: read
await corsair.github.api.workflows.listRuns({});
Input
Name	Type	Required	Description
owner	string	Yes	—
repo	string	Yes	—
actor	string	No	—
branch	string	No	—
event	string	No	—
status	completed | action_required | cancelled | failure | neutral | skipped | stale | success | timed_out | in_progress | queued | requested | waiting | pending	No	—
perPage	number	No	—
page	number	No	—
created	string	No	—
excludePullRequests	boolean	No	—
checkSuiteId	number	No	—
headSha	string	No	—
Output
Name	Type	Required	Description
totalCount	number	No	—
total_count	number	No	—
workflowRuns	object[]	No	—
workflow_runs	object[]	No	—
workflowRuns full type

workflow_runs full type

Get Credentials
Previous
Database
Next
Powered by
This documentation is built and hosted on Mintlify, a developer documentation platform
API - Corsair



> ## Documentation Index
> Fetch the complete documentation index at: https://docs.corsair.dev/llms.txt
> Use this file to discover all available pages before exploring further.

# Database

> Github local sync: searchable entities, `.search()` filters, and operators.

The Github plugin syncs data locally. Use `corsair.github.db.<entity>.search({ data, limit?, offset? })` with the filters listed per entity.

<Info>
  **New to Corsair?** See [database operations](/concepts/database), [data synchronization](/concepts/integrations), and [multi-tenancy](/concepts/multi-tenancy).
</Info>

## Branches

Path: `github.db.branches.search`

```ts theme={null}
const rows = await corsair.github.db.branches.search({
    data: { /* filters below */ },
    limit: 100,
    offset: 0,
});
```

### Searchable filters

| Field                | Type      | Operators                                  |
| -------------------- | --------- | ------------------------------------------ |
| `entity_id`          | `string`  | equals, contains, startsWith, endsWith, in |
| `repositoryId`       | `number`  | equals, gt, gte, lt, lte, in               |
| `repositoryFullName` | `string`  | equals, contains, startsWith, endsWith, in |
| `name`               | `string`  | equals, contains, startsWith, endsWith, in |
| `sha`                | `string`  | equals, contains, startsWith, endsWith, in |
| `protected`          | `boolean` | equals                                     |
| `deletedAt`          | `date`    | equals, before, after, between             |

*Every `.search()` also accepts `limit` and `offset` for pagination. `.list()` is available on the same path without the `.search` suffix in code — see [database operations](/concepts/database).*

***

## Comments

Path: `github.db.comments.search`

```ts theme={null}
const rows = await corsair.github.db.comments.search({
    data: { /* filters below */ },
    limit: 100,
    offset: 0,
});
```

### Searchable filters

| Field               | Type     | Operators                                  |
| ------------------- | -------- | ------------------------------------------ |
| `entity_id`         | `string` | equals, contains, startsWith, endsWith, in |
| `id`                | `number` | equals, gt, gte, lt, lte, in               |
| `nodeId`            | `string` | equals, contains, startsWith, endsWith, in |
| `url`               | `string` | equals, contains, startsWith, endsWith, in |
| `htmlUrl`           | `string` | equals, contains, startsWith, endsWith, in |
| `issueUrl`          | `string` | equals, contains, startsWith, endsWith, in |
| `body`              | `string` | equals, contains, startsWith, endsWith, in |
| `authorAssociation` | `string` | equals, contains, startsWith, endsWith, in |
| `createdAt`         | `date`   | equals, before, after, between             |
| `updatedAt`         | `date`   | equals, before, after, between             |
| `deletedAt`         | `date`   | equals, before, after, between             |

*Every `.search()` also accepts `limit` and `offset` for pagination. `.list()` is available on the same path without the `.search` suffix in code — see [database operations](/concepts/database).*

***

## Discussions

Path: `github.db.discussions.search`

```ts theme={null}
const rows = await corsair.github.db.discussions.search({
    data: { /* filters below */ },
    limit: 100,
    offset: 0,
});
```

### Searchable filters

| Field               | Type      | Operators                                  |
| ------------------- | --------- | ------------------------------------------ |
| `entity_id`         | `string`  | equals, contains, startsWith, endsWith, in |
| `id`                | `number`  | equals, gt, gte, lt, lte, in               |
| `nodeId`            | `string`  | equals, contains, startsWith, endsWith, in |
| `htmlUrl`           | `string`  | equals, contains, startsWith, endsWith, in |
| `repositoryUrl`     | `string`  | equals, contains, startsWith, endsWith, in |
| `number`            | `number`  | equals, gt, gte, lt, lte, in               |
| `title`             | `string`  | equals, contains, startsWith, endsWith, in |
| `body`              | `string`  | equals, contains, startsWith, endsWith, in |
| `state`             | `string`  | equals, contains, startsWith, endsWith, in |
| `locked`            | `boolean` | equals                                     |
| `comments`          | `number`  | equals, gt, gte, lt, lte, in               |
| `authorAssociation` | `string`  | equals, contains, startsWith, endsWith, in |
| `categoryId`        | `number`  | equals, gt, gte, lt, lte, in               |
| `categoryName`      | `string`  | equals, contains, startsWith, endsWith, in |
| `createdAt`         | `date`    | equals, before, after, between             |
| `updatedAt`         | `date`    | equals, before, after, between             |
| `answerChosenAt`    | `date`    | equals, before, after, between             |
| `deletedAt`         | `date`    | equals, before, after, between             |

*Every `.search()` also accepts `limit` and `offset` for pagination. `.list()` is available on the same path without the `.search` suffix in code — see [database operations](/concepts/database).*

***

## Events

Path: `github.db.events.search`

```ts theme={null}
const rows = await corsair.github.db.events.search({
    data: { /* filters below */ },
    limit: 100,
    offset: 0,
});
```

### Searchable filters

| Field       | Type     | Operators                                  |
| ----------- | -------- | ------------------------------------------ |
| `entity_id` | `string` | equals, contains, startsWith, endsWith, in |

*Every `.search()` also accepts `limit` and `offset` for pagination. `.list()` is available on the same path without the `.search` suffix in code — see [database operations](/concepts/database).*

***

## Forks

Path: `github.db.forks.search`

```ts theme={null}
const rows = await corsair.github.db.forks.search({
    data: { /* filters below */ },
    limit: 100,
    offset: 0,
});
```

### Searchable filters

| Field                | Type      | Operators                                  |
| -------------------- | --------- | ------------------------------------------ |
| `entity_id`          | `string`  | equals, contains, startsWith, endsWith, in |
| `id`                 | `number`  | equals, gt, gte, lt, lte, in               |
| `nodeId`             | `string`  | equals, contains, startsWith, endsWith, in |
| `fullName`           | `string`  | equals, contains, startsWith, endsWith, in |
| `htmlUrl`            | `string`  | equals, contains, startsWith, endsWith, in |
| `description`        | `string`  | equals, contains, startsWith, endsWith, in |
| `private`            | `boolean` | equals                                     |
| `fork`               | `boolean` | equals                                     |
| `url`                | `string`  | equals, contains, startsWith, endsWith, in |
| `sourceRepoId`       | `number`  | equals, gt, gte, lt, lte, in               |
| `sourceRepoFullName` | `string`  | equals, contains, startsWith, endsWith, in |
| `defaultBranch`      | `string`  | equals, contains, startsWith, endsWith, in |
| `createdAt`          | `date`    | equals, before, after, between             |
| `updatedAt`          | `date`    | equals, before, after, between             |
| `pushedAt`           | `date`    | equals, before, after, between             |

*Every `.search()` also accepts `limit` and `offset` for pagination. `.list()` is available on the same path without the `.search` suffix in code — see [database operations](/concepts/database).*

***

## Issues

Path: `github.db.issues.search`

```ts theme={null}
const rows = await corsair.github.db.issues.search({
    data: { /* filters below */ },
    limit: 100,
    offset: 0,
});
```

### Searchable filters

| Field           | Type      | Operators                                  |
| --------------- | --------- | ------------------------------------------ |
| `entity_id`     | `string`  | equals, contains, startsWith, endsWith, in |
| `id`            | `number`  | equals, gt, gte, lt, lte, in               |
| `nodeId`        | `string`  | equals, contains, startsWith, endsWith, in |
| `url`           | `string`  | equals, contains, startsWith, endsWith, in |
| `repositoryUrl` | `string`  | equals, contains, startsWith, endsWith, in |
| `labelsUrl`     | `string`  | equals, contains, startsWith, endsWith, in |
| `commentsUrl`   | `string`  | equals, contains, startsWith, endsWith, in |
| `eventsUrl`     | `string`  | equals, contains, startsWith, endsWith, in |
| `htmlUrl`       | `string`  | equals, contains, startsWith, endsWith, in |
| `number`        | `number`  | equals, gt, gte, lt, lte, in               |
| `state`         | `string`  | equals, contains, startsWith, endsWith, in |
| `title`         | `string`  | equals, contains, startsWith, endsWith, in |
| `body`          | `string`  | equals, contains, startsWith, endsWith, in |
| `locked`        | `boolean` | equals                                     |
| `comments`      | `number`  | equals, gt, gte, lt, lte, in               |
| `createdAt`     | `date`    | equals, before, after, between             |
| `updatedAt`     | `date`    | equals, before, after, between             |
| `closedAt`      | `date`    | equals, before, after, between             |
| `deletedAt`     | `date`    | equals, before, after, between             |

*Every `.search()` also accepts `limit` and `offset` for pagination. `.list()` is available on the same path without the `.search` suffix in code — see [database operations](/concepts/database).*

***

## Pull Requests

Path: `github.db.pullRequests.search`

```ts theme={null}
const rows = await corsair.github.db.pullRequests.search({
    data: { /* filters below */ },
    limit: 100,
    offset: 0,
});
```

### Searchable filters

| Field            | Type      | Operators                                  |
| ---------------- | --------- | ------------------------------------------ |
| `entity_id`      | `string`  | equals, contains, startsWith, endsWith, in |
| `id`             | `number`  | equals, gt, gte, lt, lte, in               |
| `nodeId`         | `string`  | equals, contains, startsWith, endsWith, in |
| `url`            | `string`  | equals, contains, startsWith, endsWith, in |
| `htmlUrl`        | `string`  | equals, contains, startsWith, endsWith, in |
| `diffUrl`        | `string`  | equals, contains, startsWith, endsWith, in |
| `patchUrl`       | `string`  | equals, contains, startsWith, endsWith, in |
| `issueUrl`       | `string`  | equals, contains, startsWith, endsWith, in |
| `number`         | `number`  | equals, gt, gte, lt, lte, in               |
| `locked`         | `boolean` | equals                                     |
| `title`          | `string`  | equals, contains, startsWith, endsWith, in |
| `body`           | `string`  | equals, contains, startsWith, endsWith, in |
| `createdAt`      | `date`    | equals, before, after, between             |
| `updatedAt`      | `date`    | equals, before, after, between             |
| `closedAt`       | `date`    | equals, before, after, between             |
| `mergedAt`       | `date`    | equals, before, after, between             |
| `mergeCommitSha` | `string`  | equals, contains, startsWith, endsWith, in |
| `draft`          | `boolean` | equals                                     |
| `merged`         | `boolean` | equals                                     |
| `mergeable`      | `boolean` | equals                                     |
| `comments`       | `number`  | equals, gt, gte, lt, lte, in               |
| `reviewComments` | `number`  | equals, gt, gte, lt, lte, in               |
| `commits`        | `number`  | equals, gt, gte, lt, lte, in               |
| `additions`      | `number`  | equals, gt, gte, lt, lte, in               |
| `deletions`      | `number`  | equals, gt, gte, lt, lte, in               |
| `changedFiles`   | `number`  | equals, gt, gte, lt, lte, in               |

*Every `.search()` also accepts `limit` and `offset` for pagination. `.list()` is available on the same path without the `.search` suffix in code — see [database operations](/concepts/database).*

***

## Releases

Path: `github.db.releases.search`

```ts theme={null}
const rows = await corsair.github.db.releases.search({
    data: { /* filters below */ },
    limit: 100,
    offset: 0,
});
```

### Searchable filters

| Field             | Type      | Operators                                  |
| ----------------- | --------- | ------------------------------------------ |
| `entity_id`       | `string`  | equals, contains, startsWith, endsWith, in |
| `id`              | `number`  | equals, gt, gte, lt, lte, in               |
| `nodeId`          | `string`  | equals, contains, startsWith, endsWith, in |
| `url`             | `string`  | equals, contains, startsWith, endsWith, in |
| `htmlUrl`         | `string`  | equals, contains, startsWith, endsWith, in |
| `assetsUrl`       | `string`  | equals, contains, startsWith, endsWith, in |
| `uploadUrl`       | `string`  | equals, contains, startsWith, endsWith, in |
| `tarballUrl`      | `string`  | equals, contains, startsWith, endsWith, in |
| `zipballUrl`      | `string`  | equals, contains, startsWith, endsWith, in |
| `tagName`         | `string`  | equals, contains, startsWith, endsWith, in |
| `targetCommitish` | `string`  | equals, contains, startsWith, endsWith, in |
| `name`            | `string`  | equals, contains, startsWith, endsWith, in |
| `body`            | `string`  | equals, contains, startsWith, endsWith, in |
| `draft`           | `boolean` | equals                                     |
| `prerelease`      | `boolean` | equals                                     |
| `createdAt`       | `date`    | equals, before, after, between             |
| `publishedAt`     | `date`    | equals, before, after, between             |
| `deletedAt`       | `date`    | equals, before, after, between             |

*Every `.search()` also accepts `limit` and `offset` for pagination. `.list()` is available on the same path without the `.search` suffix in code — see [database operations](/concepts/database).*

***

## Repositories

Path: `github.db.repositories.search`

```ts theme={null}
const rows = await corsair.github.db.repositories.search({
    data: { /* filters below */ },
    limit: 100,
    offset: 0,
});
```

### Searchable filters

| Field             | Type      | Operators                                  |
| ----------------- | --------- | ------------------------------------------ |
| `entity_id`       | `string`  | equals, contains, startsWith, endsWith, in |
| `id`              | `number`  | equals, gt, gte, lt, lte, in               |
| `nodeId`          | `string`  | equals, contains, startsWith, endsWith, in |
| `name`            | `string`  | equals, contains, startsWith, endsWith, in |
| `fullName`        | `string`  | equals, contains, startsWith, endsWith, in |
| `private`         | `boolean` | equals                                     |
| `htmlUrl`         | `string`  | equals, contains, startsWith, endsWith, in |
| `description`     | `string`  | equals, contains, startsWith, endsWith, in |
| `fork`            | `boolean` | equals                                     |
| `url`             | `string`  | equals, contains, startsWith, endsWith, in |
| `createdAt`       | `date`    | equals, before, after, between             |
| `updatedAt`       | `date`    | equals, before, after, between             |
| `pushedAt`        | `date`    | equals, before, after, between             |
| `defaultBranch`   | `string`  | equals, contains, startsWith, endsWith, in |
| `language`        | `string`  | equals, contains, startsWith, endsWith, in |
| `stargazersCount` | `number`  | equals, gt, gte, lt, lte, in               |
| `watchersCount`   | `number`  | equals, gt, gte, lt, lte, in               |
| `forksCount`      | `number`  | equals, gt, gte, lt, lte, in               |
| `openIssuesCount` | `number`  | equals, gt, gte, lt, lte, in               |
| `archived`        | `boolean` | equals                                     |
| `disabled`        | `boolean` | equals                                     |
| `deletedAt`       | `date`    | equals, before, after, between             |

*Every `.search()` also accepts `limit` and `offset` for pagination. `.list()` is available on the same path without the `.search` suffix in code — see [database operations](/concepts/database).*

***

## Users

Path: `github.db.users.search`

```ts theme={null}
const rows = await corsair.github.db.users.search({
    data: { /* filters below */ },
    limit: 100,
    offset: 0,
});
```

### Searchable filters

| Field       | Type     | Operators                                  |
| ----------- | -------- | ------------------------------------------ |
| `entity_id` | `string` | equals, contains, startsWith, endsWith, in |

*Every `.search()` also accepts `limit` and `offset` for pagination. `.list()` is available on the same path without the `.search` suffix in code — see [database operations](/concepts/database).*

***

## Workflows

Path: `github.db.workflows.search`

```ts theme={null}
const rows = await corsair.github.db.workflows.search({
    data: { /* filters below */ },
    limit: 100,
    offset: 0,
});
```

### Searchable filters

| Field       | Type     | Operators                                  |
| ----------- | -------- | ------------------------------------------ |
| `entity_id` | `string` | equals, contains, startsWith, endsWith, in |
| `id`        | `number` | equals, gt, gte, lt, lte, in               |
| `nodeId`    | `string` | equals, contains, startsWith, endsWith, in |
| `name`      | `string` | equals, contains, startsWith, endsWith, in |
| `path`      | `string` | equals, contains, startsWith, endsWith, in |
| `url`       | `string` | equals, contains, startsWith, endsWith, in |
| `htmlUrl`   | `string` | equals, contains, startsWith, endsWith, in |
| `badgeUrl`  | `string` | equals, contains, startsWith, endsWith, in |
| `createdAt` | `date`   | equals, before, after, between             |
| `updatedAt` | `date`   | equals, before, after, between             |
| `deletedAt` | `date`   | equals, before, after, between             |

*Every `.search()` also accepts `limit` and `offset` for pagination. `.list()` is available on the same path without the `.search` suffix in code — see [database operations](/concepts/database).*

***
