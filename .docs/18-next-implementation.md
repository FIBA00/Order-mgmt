# Next Implementation

Build in this exact order.

## Step 1

Create the monorepo with:

```text
apps/
  frontend
  backend
  desktop
database/
docs/
scripts/
```

## Step 2

Implement backend:

- SQLite connection
- migrations
- seed
- auth
- menu
- orders
- dashboard

## Step 3

Implement React.

## Step 4

Connect React to HTTP API.

At this point it is a normal local web application.

## Step 5

Add Electron.

Load the React production build.

## Step 6

Move local privileged operations behind preload + IPC.

## Step 7

Move database into OS application-data directory.

## Step 8

Add first-run setup.

## Step 9

Package Windows installer with Electron Forge.

## Step 10

Add development signing demonstration.

## Step 11

Add CI build/release.

## Step 12

Add real production signing configuration as secrets, without committing credentials.

## Step 13

Add remote release checking and update installation.

## Step 14

Test:

```text
v1 -> v2
```

with real data.

## Step 15

Add SaaS PostgreSQL deployment.

Only after the desktop path is understood.

## Final comparison

Document what changed between:

```text
web
desktop
SaaS
hybrid
```
