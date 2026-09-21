# Tavvy current engineering status

As of September 21, 2026, 00:37 America/New_York (04:37 UTC).
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
| Native internal preview | Latest uploaded internal iOS preview finished: app version 1.0.1, build 26, from the 616-file snapshot. | Later 617-file candidate tested locally only; no App Store submission. |
| iPad navigation | Account, RV & Camping, Universes, Realtors, Saved and personal sign-in passed fresh-install landscape and update portrait checks on the later local candidate. | Tested on iPad Air 11-inch M4 / iOS 26.5, not the original reviewer device/OS. |

The latest verified web eCard gallery release was deployed September 21 after 04:13 UTC;
its public Next build identifier is `Wqqvxviynheqtl3oYWT94`. It includes design-first
creation, all 21 layouts / 123 palettes, fictional portrait/background examples and
real 9:16 gallery previews. Five unit checks, 17 creation-flow browser checks and
21 real renderer checks passed before deployment; live gallery/image checks passed.
The image-optimizer performance release also passed production checks: tested 640px
portraits now load as WebP at about 39KB and 77KB. All layouts/palettes remain available.
Release evidence is held with the maintainer.

## Active work and next actions

### Search — active recovery, preserve progress

The interrupted import resumed from its verified 6,180,000-record checkpoint.
The full saved prefix was audited, two text fields restored from backup, and all
6,180,000 complete records rechecked with zero differences. A later interruption at
6,348,000 was reconciled by exact readback of its unfinished batch, preserving all
acknowledged progress. The latest continuation passed 7.7 million of 34,883,915
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
visibility, review-grid integration, browser Back state and smooth touch-sheet behavior.

### eCards — web chooser delivered; native and captures pending

- Design choice is the default web start; Quick setup and full type/country options remain.
- Web gallery/editor previews use the actual renderer. All 21 layouts / 123 palettes
  remain, with clear Pro restrictions and preservation of entered information.
- Reusable decorations may populate drafts; fictional example identities/photos/links
  are never copied into customers' saved cards.
- Actual iPhone Safari captures include corrected Classic, Chef and Modern examples;
  the complete 21-template Simulator set is still being captured. Browser-only captures
  of every layout are separate evidence, not native or App Store screenshots.
- Native parity passed 14 focused behavior checks, TypeScript and a new Xcode Simulator
  build. Its current-source visual checks and EAS upload remain pending.
- Existing-card audit covered 37 published cards, with baseline captures and five
  postrelease comparisons. Lower-page interactions remain a separate verification.
- Newly introduced copy still needs the final multilingual pass.

Existing real cards must not become template examples. Previously requested narrow
real-card corrections have separate private evidence; no customer inventory belongs
in this public status document.

### Place details, reviews and restaurant tools

- Finish the shared four-part review grid on search previews and all detail surfaces.
  Web/mobile source work has started; it is not a verified universal rollout.
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
| Shared tool headers | Universe-style source changes and browser checks prepared. | Integrate and release; verify every tool in both themes. |
| On The Go | Full discovery/detail/owner changes prepared; backend lifecycle dependency remains. | Resolve lifecycle/identity rules, confirmed mobile location, stories, authorization and expiry; apply validated migration and release. |
| RV & Camping | Existing canonical parks/campgrounds remain; current bounded browse queries hide some records. | Correct filtering/pagination/classification, category-specific taps and canonical details. Offline maps are not implemented. |
| Cruises | Catalog/review source and rollback-tested migrations prepared. First sourced batch contains 12 draft ships (4 ocean, 4 river, 4 expedition), 48 venues and 36 cabin categories. Further operator fleet inventory is active. | Review canonical identity/deduplication, verify remaining facts/media permissions, apply migrations and publish reviewed batches. No fleet data has been published; worldwide coverage remains incomplete. |
| Atlas | Existing reading themes/text-size confirmed; audio fixes partly live. | Improve discoverability/persistence checks; integrate full audio UI and atomically deploy the reviewed scheduled producer. |
| UGC | Reporting/blocking/moderation source and rollback checks prepared. | Apply backend dependencies, complete operational moderation and verify all exposed surfaces. Not live yet. |

The earlier request to locate an attributed RV article was closed by the requester
after no match was found. Do not substitute a person's eCard or invent attributed content.

### Apple, languages and screenshots — incomplete

- Finish final iPhone and 13-inch iPad screenshot sets, prioritizing English,
  Portuguese and Spanish, against the final build.
- Complete and verify account deletion backend behavior before claiming readiness.
- Release and test UGC reporting, blocking and moderation.
- Resolve the digital-purchase strategy and verify visible language coverage.
- Prepare accurate reviewer sign-in instructions and rerun iPad navigation checks.
- Produce the final internal/production builds and submission materials. An internal
  preview build, browser eCard screenshots and App Store screenshot sets are different.

## Handoff discipline

After each batch, record the release date, target, actual checks and remaining work.
Mirror product behavior and this high-level status in the mobile repository. Preserve
existing work and data, and keep operational evidence out of public Git history.
