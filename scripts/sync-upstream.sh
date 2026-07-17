#!/usr/bin/env bash
# sync-upstream.sh — pull an upstream OHIF release tag into a Puru sync branch.
#
# Usage:
#   scripts/sync-upstream.sh v3.13.0            # target upstream tag
#   scripts/sync-upstream.sh v3.13.0 3.12.0     # explicit "current puru version"
#
# What it does:
#   1. Ensures the `upstream` remote points at OHIF/Viewers.
#   2. Fetches tags.
#   3. Creates `sync/<upstream-tag>` off the current Puru branch.
#   4. Merges the upstream tag with `-X ours` on Puru-owned paths so branding
#      + custom modes/extensions aren't clobbered by upstream diffs.
#   5. Prints the follow-up steps (resolve conflicts, test, tag Puru release).
#
# Never force-pushes. Never rebases. Merge-only, in-tree conflict resolution.

set -euo pipefail

UPSTREAM_URL="https://github.com/OHIF/Viewers.git"
UPSTREAM_TAG="${1:-}"

if [[ -z "$UPSTREAM_TAG" ]]; then
  echo "Usage: $0 <upstream-tag> (e.g. v3.13.0)" >&2
  exit 1
fi

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
SYNC_BRANCH="sync/${UPSTREAM_TAG}"

# 1. Upstream remote
if ! git remote get-url upstream >/dev/null 2>&1; then
  echo "→ Adding upstream remote"
  git remote add upstream "$UPSTREAM_URL"
fi

# 2. Fetch
echo "→ Fetching upstream tags"
git fetch upstream --tags --prune

if ! git rev-parse -q --verify "refs/tags/${UPSTREAM_TAG}" >/dev/null; then
  echo "Upstream tag ${UPSTREAM_TAG} not found. Available recent tags:" >&2
  git tag -l 'v3.*' --sort=-v:refname | head -n 20 >&2
  exit 2
fi

# 3. Sync branch off the current Puru branch
echo "→ Creating ${SYNC_BRANCH} from ${CURRENT_BRANCH}"
git checkout -b "$SYNC_BRANCH"

# 4. Merge upstream tag. `-X ours` on the whole merge would hide real
# conflicts, so we merge honestly and let git report them. Puru-owned paths
# should never diverge because upstream doesn't touch them.
echo "→ Merging upstream ${UPSTREAM_TAG}"
if ! git merge --no-ff --no-edit \
    -m "sync: merge upstream ${UPSTREAM_TAG}" \
    "refs/tags/${UPSTREAM_TAG}"; then
  echo ""
  echo "Merge produced conflicts. Puru-owned paths shouldn't conflict — if any of"
  echo "these appear in \`git status\`, prefer the Puru side (git checkout --ours):"
  echo "  extensions/puru-*/"
  echo "  modes/puru-*/"
  echo "  platform/app/src/launcher/"
  echo "  platform/app/src/routes/PuruLanding/"
  echo "  platform/app/public/config/default.js"
  echo "  platform/app/public/app-config.js"
  echo "  platform/app/public/puru-logo.svg"
  echo "  platform/app/public/manifest.json"
  echo ""
  echo "For 'ours' resolution across a directory:"
  echo "  git checkout --ours extensions/puru-reports extensions/puru-branding modes/puru-quick modes/puru-report"
  echo "  git add extensions/puru-reports extensions/puru-branding modes/puru-quick modes/puru-report"
  exit 3
fi

cat <<POST
✓ Sync branch ${SYNC_BRANCH} created.

Next steps:
  1. yarn install
  2. yarn dev  (smoke — confirm the app boots, /puru-report + /puru-quick still route)
  3. If anything broke in @ohif/extension-puru-* — patch here on the sync branch.
  4. Commit fixes, open PR ${SYNC_BRANCH} → ${CURRENT_BRANCH}.
  5. After merge: git tag puru-${UPSTREAM_TAG}-p1 && git push origin puru-${UPSTREAM_TAG}-p1
     Cloud Build will publish dviewer:puru-${UPSTREAM_TAG}-p1 for pinned rollout.
POST
