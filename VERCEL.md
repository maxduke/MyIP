# Vercel deployment and upstream sync

This fork deploys the Vite SPA as static files and the complete Express API
as **one Node Function**. New upstream API handlers are imported through
`backend-server.js`; they do not become additional Functions. Keep the two
explicit builders in `vercel.json`: a rewrite alone does not prevent Vercel
from discovering every file under `api/` as a Function.

## Deployment layer

- `vercel.json`: the static build, single Node entry, published dataset
  allowlist, API routing and SPA fallback. Static SPA assets are served by
  the CDN and excluded from the Node bundle, along with updater state and
  temporary/backup files.
- `vercel/package.json`: the Node builder's own `vercel-build` hook. It runs
  dataset preparation before Function tracing on every build, including a
  cached install where pnpm skips `postinstall`. The root package and lockfile
  remain identical to upstream, and the static builder runs Vite separately.
- `vercel/prepare.js`: uses the upstream
  dataset registry/updater to prepare CAIDA organization/relationship data
  and IEEE MAC registries. MaxMind requires `MAXMIND_ACCOUNT_ID` and
  `MAXMIND_LICENSE_KEY`; PeeringDB requires `CLOUDFLARE_API_KEY` (or its legacy
  name). Ordinary installs do not download datasets. An enabled dataset that
  cannot be prepared fails the build, preserving the previous deployment.
- `vercel/server.js`: imports the backend without its standalone boot,
  opens bundled MaxMind readers and attaches request-driven status hydration.
  The other dataset readers load their packaged files at import. Runtime
  does not start dataset downloads, file watchers or background schedulers.
- `vercel/runtime.js`: JSON logging, exact Vercel system hostnames added to
  `ALLOWED_DOMAINS`, one shared status refresh per warm instance every five
  minutes, and Vercel CDN headers derived from the backend's public-cache
  opt-ins. Private, no-store and error responses are not opted into caching.

Dataset files are immutable deployment snapshots; redeploy to refresh them.
The standalone Node/Docker boot retains the upstream update/watch schedules.
MaxMind stays hidden when its databases are absent or cannot be opened.
Custom hostnames still belong in `ALLOWED_DOMAINS`; system deployment,
branch and production hostnames are added automatically.

Keep the Vercel project's Node version at **24.x**, matching CI and the
upstream package's engine requirement. The upstream-pinned pnpm version in
`package.json` and its lockfile should move together. The explicit root
package in `pnpm-workspace.yaml` also supports Vercel's older pnpm fallback.

## Hobby limits

The single Function avoids the per-deployment Function-count problem.
Published datasets have a conservative **200,000,000-byte build budget**,
reserving 50 MB for traced code/runtime within the standard 250 MB Node
Function bundle limit. This data budget is not a measurement of the final
bundle: inspect the actual traced Function after dependency/data changes.
The platform still enforces the complete bundle limit. Do not enable the
large-functions beta to bypass a size failure.

With Fluid Compute, Hobby allows 300 seconds per invocation, 2 GB memory
and a 4.5 MB request/response body limit. This adapter uses a 60-second
deadline, which also fits Hobby projects without Fluid Compute.
Public cache headers reduce repeat
Function calls; auth-context endpoints remain uncached. The speed test
talks to Cloudflare directly rather than proxying bulk traffic through this
Function.

One Function does **not** guarantee staying inside monthly quotas. Hobby
currently includes 1 million Function invocations, 4 active CPU hours,
360 GB-hours of provisioned memory, 100 GB fast data transfer and 10 GB
origin transfer. Check the Vercel usage dashboard; traffic across projects
and preview deployments can consume the same account allowance.

Official references: [Function limits](https://vercel.com/docs/functions/limitations),
[Hobby allowances](https://vercel.com/docs/plans/hobby),
[CDN cache headers](https://vercel.com/docs/caching/cache-control-headers).

## Keeping upstream merges small

Upstream-owned code in `common/`, the Service Status handlers and their
existing tests stays identical to upstream. Avoid adding Vercel environment
branches there. The small shared changes are:

1. `backend-server.js` exports the Express app and only calls `bootBackend`
   during direct execution.
2. `/api/configs` reports MaxMind reader readiness; the source registry and
   lookup composable respect that flag. Their existing tests cover it.
3. Root `AGENTS.md` points to the deployment files and this document.
4. `pnpm-workspace.yaml` explicitly includes the root package for pnpm 9
   compatibility on older Vercel projects.

GitHub Sync fork can merge future upstream changes when they do not edit
these same lines. This reduces conflicts; it cannot guarantee conflict-free
merges after arbitrary upstream refactors. Complete independence requires
an unchanged source mirror plus a separate deployment repository, or
upstream adoption of these small generic app/readiness changes.

For manual integration, start from `dev`, fetch upstream and prepare a
reviewable merge with `git merge --no-commit upstream/main`. Resolve changes
by preserving upstream handlers/data readers and adjusting the deployment
layer. Run `pnpm install --frozen-lockfile` and `pnpm check`, inspect the
single Function's bundle and a preview deployment, then commit only after
user approval. Preserve the upstream merge's two parents, and use a merge
commit for the `dev` → `main` release PR: squashing this integration loses
the upstream ancestry GitHub needs for later syncs. Do not force-sync or
discard the fork's deployment files. The upstream sync workflow is kept
unchanged; using its direct-to-main sync is a separate release choice.

`tests/vercel-deployment.test.js` checks that exactly one Node entry is built,
every current dataset's published files are allowlisted, and the adapter
serves upstream routes with the same guards. `tests/vercel-runtime.test.js`
covers concurrent refresh, expiry/retry, host configuration and cache gates.
`tests/vercel-prepare.test.js` covers install gating, failed downloads,
missing files and the dataset budget without network access.
