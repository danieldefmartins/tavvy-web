# Tavvy current engineering status

As of September 21, 2026, 02:08 America/New_York (06:08 UTC).
Read [PROJECT_MEMORY.md](PROJECT_MEMORY.md) for product decisions and architecture.
This is a dated checkpoint, not a claim that the full requested release is complete.

## Source and release warning

The active web/mobile workspaces contain substantial changes beyond committed `main`,
including both released code and unrelated unfinished work. Recent deployments used
isolated, reviewed source snapshots. This documentation update does not commit those
application changes, and Git HEAD alone does not reproduce the current deployed app.
Obtain the reviewed release snapshot and private evidence from the maintainer before
preparing the next release. Do not deploy a mixed working directory or assume every
local migration has been applied.

## Verified recent deliveries

| Area | Verified result | Limits |
| --- | --- | --- |
| Web appearance / preview / language batch | Device/Light/Dark controls, larger logo, real 9:16 eCard preview and language-control corrections released and browser checked. | Remaining legacy labels and all cross-tool parity still require verification. |
| Latest eCard visual release | Shared renderer corrections, template/palette preservation, corrected clipping and badge/contact spacing released. Build and 21-layout preview bridge passed. Five affected public cards passed postrelease iPhone Simulator Safari checks. | Design-first creation, fictional examples and actual renderer galleries are now released separately below. Native changes still need the next mobile release. |
| Public eCard availability | Bounded read retry; temporary lookup failures return unavailable/503 rather than a misleading not-found page. Ten focused checks passed. | Does not change ownership or bypass public visibility rules. |
| Place sharing | New place-specific OG images and metadata with name, category/subcategory, location, trusted photo treatment and designed fallback are live. Crawler checks and actual 1200×630 output verified. | Arbitrary external photos use direct images; broader Arabic/CJK image font coverage remains. |
| On The Go appearance | Earlier web Light/Dark background correction is live. | Full On The Go workflow is not released. |
| Atlas audio | Full recordings for both voices repaired and checked for Los Angeles, Chicago and Nashville. Generation access guard released. | Full producer and audio UI rollout remains separate. |
| Native internal preview | Latest uploaded internal iOS preview finished: app version 1.0.1, build 26, from the 616-file snapshot. | Later 663-file Simulator build now passes compilation; current-binary UI checks are underway. No App Store submission. |
| iPad navigation | Account, RV & Camping, Universes, Realtors, Saved and personal sign-in passed fresh-install landscape and update portrait checks on the later local candidate. | Tested on iPad Air 11-inch M4 / iOS 26.5, not the original reviewer device/OS. |

The latest verified web eCard gallery release was deployed September 21 after 04:13 UTC;
its public Next build identifier is `Wqqvxviynheqtl3oYWT94`. It includes design-first
creation, all 21 layouts / 123 palettes, fictional portrait/background examples and
real 9:16 gallery previews. Five unit checks, 17 creation-flow browser checks and
21 real renderer checks passed before deployment; live gallery/image checks passed.
The image-optimizer performance release also passed production checks: tested 640px
portraits now load as WebP at about 39KB and 77KB. All layouts/palettes remain available.
Release evidence is held with the maintainer.

The cruise and community-safety web release is now live, with public Next build
`1Ag6HljLdoOBMpgGmZCnL`. It preserves the eCard gallery and image optimization above.
Four reviewed database migrations were applied atomically and their exact bodies,
permissions and row-level protections checked after commit. The initial 12 sourced
ships are published: four ocean, four river and four expedition ships, from nine
operators. All 12 public pages, crawler metadata, ship sharing image and anonymous
catalog reads passed postrelease checks. Unknown facts and unverified photos remain
unfilled. This is the first verified batch, not worldwide coverage.

The admin community-moderation release is also live. Its public login page and client
asset load; anonymous moderation access is denied. Local behavior checks cover
reporting, blocking, hide/restore and evidence visibility, including stale account
requests. Logged-in production moderation actions have not been exercised against
customer content. Native integration and account-deletion release gates remain.

The newer shared-tools release is live with public build `alPQmC8IHFEztl5rzBgEO`.
It preserves cruises, community safety and eCard features, and adds consistent tool
headers, canonical RV filtering/pagination, actual review grids, domain-specific
core matching and further eCard finishing. Root checked 35 focused web cases, nine
RV browser scenarios and 28 live HTTP routes. The prepared On The Go release has
not yet replaced this serving build at this checkpoint.

## Active work and next actions

### Search — active recovery, preserve progress

The interrupted import resumed from its verified 6,180,000-record checkpoint.
The full saved prefix was audited, two text fields restored from backup, and all
6,180,000 complete records rechecked with zero differences. A later interruption at
6,348,000 was reconciled by exact readback of its unfinished batch, preserving all
acknowledged progress. The latest continuation passed 11.5 million of 34,883,915
records at this checkpoint. This is not a completed migration. Serving search remains
unchanged. The full backup's immutable content-hash ledger is complete.

The resumed importer uses ASCII JSON transport, durable per-batch journaling and
exact per-record response checks. Uncertain writes receive bounded exact readback;
only records proven absent may be retried. Unresolved outcomes stop for review. The
approved migration still needs complete data/configuration verification, search and
permission checks, replacement restart persistence, producer reconciliation and a
verified traffic switch. Private infrastructure identifiers, keys, backup data and
operational commands are intentionally held in the maintainer's private runbook.

Search product work also remains: explicit destination precedence, named-place/demo
visibility, browser Back state and smooth touch-sheet behavior. The shared review grid is now live in search and RV previews.

### eCards — web chooser and template captures delivered; native finishing underway

- Design choice is the default web start; Quick setup and full type/country options remain.
- Web gallery/editor previews use the actual renderer. All 21 layouts / 123 palettes
  remain, with clear Pro restrictions and preservation of entered information.
- Reusable decorations may populate drafts; fictional example identities/photos/links
  are never copied into customers' saved cards.
- All 21 actual iPhone Simulator Safari template-gallery captures are complete and
  visually reviewed. Three follow-up captures for the latest finishing polish are
  being rechecked against the serving assets. These are web template captures, not
  the native App Store screenshot set.
- The newer native 663-file candidate passed application TypeScript and Xcode Simulator
  compilation. Actual signed-in tests on the prior binary reached design selection,
  Quick setup and the first deletion confirmation (cancelled, no deletion). A preview
  Close button overlapping the status bar was fixed; fixed-binary QA and EAS remain.
- English/Portuguese/Spanish Settings and appearance navigation were exercised.
  Untranslated legacy labels remain under correction before final language screenshots.
- Existing-card audit covered 37 published cards, with baseline captures and five
  postrelease comparisons. Lower-page interactions remain a separate verification.
- Newly introduced copy still needs the final multilingual pass.

Existing real cards must not become template examples. Previously requested narrow
real-card corrections have separate private evidence; no customer inventory belongs
in this public status document.

### Place details, reviews and restaurant tools

- The shared four-part grid is live in search, RV previews and canonical place details,
  with category/subcategory core matching and deduplicated core taps. On The Go
  preview integration has been added to the next candidate; full provider parity remains.
- Verify category-specific core matching and correct ordinary-issue evidence aging.
- Keep reviews prominent without duplicated sections. Preserve the full Tavvy Menu.
- Verify owner onboarding, inline missing-place creation, profile/media/contact links,
  ordering and menu appearance end to end.
- Finish the restaurant demonstration and verify every route/action. Demo activity
  must not be inserted into real customer review tables or imply real endorsements.
- Finalize the separate restaurant membership offer before paid activation.
- Audit Realtors and Pros carefully: known source paths still use inappropriate
  mock/fallback ratings or identifiers. Do not carry those into shared review views.

### Tools and content

| Tool | Prepared / known state | Next work |
| --- | --- | --- |
| Shared tool headers | Universe-style web headers released across ten routes; native equivalents compiled. | Finish current native visual/language checks. |
| On The Go | Two reviewed migrations applied; 13 function sources/JWT modes and 30 public/unauthenticated checks passed. Owner schedules support scoped listing and cancellation. Full web/native candidate builds passed. | Complete UI rollout and activation. Starts remain disabled at this checkpoint; admin lifecycle moderation and account deletion remain separate work. |
| RV & Camping | Canonical category filtering before pagination, stable load-more, shared four-tile reviews and domain-specific core matching are live on web. Native equivalents compiled. | Final native verification. Offline map downloads are not implemented. |
| Cruises | First 12 verified ships are public with 48 sourced venues and 36 cabin categories. Another 59 identities passed collision checks and are being enriched; they are not published yet. Conflicting or unverified facts remain withheld. | Publish the reviewed enriched batch, continue worldwide coverage and finish native/language release. |
| Atlas | Existing reading themes/text-size confirmed; audio fixes partly live. | Improve discoverability/persistence checks; integrate full audio UI and atomically deploy the reviewed scheduled producer. |
| UGC | Four backend migrations, web reporting/blocking and admin moderation released. Public access checks passed; local behavior and rollback checks preserved. | Finish native release, operational signed-in QA and remaining surface review. |

The earlier request to locate an attributed RV article was closed by the requester
after no match was found. Do not substitute a person's eCard or invent attributed content.

### Apple, languages and screenshots — incomplete

- Finish final iPhone and 13-inch iPad screenshot sets, prioritizing English,
  Portuguese and Spanish, against the final build.
- Complete and verify account deletion backend behavior before claiming readiness.
  The older draft assumes identity relationships that do not match the current schema;
  the replacement must preserve shared business/payroll history and handle retries.
- Correct and verify first-time review submission across the current identity model.
  A code/schema mismatch is under review; do not assume successful reads prove writes.
- Complete native UGC release and operational signed-in moderation verification.
- Resolve the digital-purchase strategy and verify visible language coverage.
- Prepare accurate reviewer sign-in instructions and rerun iPad navigation checks.
- Produce the final internal/production builds and submission materials. An internal
  preview build, browser eCard screenshots and App Store screenshot sets are different.

## Handoff discipline

After each batch, record the release date, target, actual checks and remaining work.
Mirror product behavior and this high-level status in the mobile repository. Preserve
existing work and data, and keep operational evidence out of public Git history.
