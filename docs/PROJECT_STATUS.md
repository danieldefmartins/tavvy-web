# Tavvy current engineering status

As of September 21, 2026, 06:41 America/New_York (10:41 UTC).
Read PROJECT_MEMORY.md for product decisions. The full requested release is not complete.

## Source and release boundaries

The reviewed source branches `release/verified-web-20260921` and
`release/native-preview-20260921` have been published with the user's explicit approval.
They are not merged into main. The active main workspaces contain unrelated unfinished
work; deploy only reviewed snapshots. Source publication, web deployment, native
Simulator verification, EAS upload and App Store submission are separate states.
Relative source manifests are under `docs/release-manifests/`. Obtain private release
evidence from the maintainer; never replay migrations based only on filenames.

## Current web release

Verified live build: `tmoBgqBXf1PtF-5mX4qGV`.

- Cruises is now a ship-icon category in both Universe entry routes and a direct Tools
  entry. The directory uses the shared tool header and retains Ocean, River and
  Expedition filters. Fourteen local and fourteen deployed browser checks passed;
  public health and four entry routes returned 200. Browser catalog fixtures performed
  no customer writes. The two new discovery labels have all seventeen translations;
  complete cruise workflow translation remains pending.
- The first attempt failed startup because privately staged asset directories were
  unreadable to the container's non-root user. Explicit ownership on runtime Docker
  copies fixed this; the replacement deployment is healthy. Preserve that Docker fix.
- Includes the earlier verified search/account, owner/menu, appearance, place-sharing,
  eCard preview, tools, community-safety, On The Go and Atlas releases.
- Search honors an explicit destination over device location, separates genuine named
  results from the demo, restores browser history/list state and improves the touch
  results sheet. Twenty-three integrated and deployed fixture checks passed. Safari
  device gesture checks remain distinct from Chromium touch tests.
- Owner/menu changes prevent false save success, retain meal periods, guard stale
  account/place responses and preserve full Tavvy Menu and inline onboarding. Forty-six
  focused checks and thirteen local/deployed browser checks passed without real claims
  or menu writes.
- Public Discover/RV/Atlas/review fixed copy has forty-one new keys in seventeen
  catalogs. Fifteen integrated and deployed browser checks passed. The separate Atlas
  thirteen-category translation follow-up is prepared, not included yet.

## Cruise catalog and deferred venues

376 verified ships across 26 operators are published: 209 ocean, 149 river and
18 expedition ships, with 2,081 sourced venues, 60 cabin categories and 71 programs.
Batches 001–006 passed collision, rollback, publication and public projection gates.
The latest 34 ships additionally passed51 live route/projection checks. Worldwide
overnight fleet coverage remains incomplete. Preserve unknown/conflicting values;
do not invent ship photos, reviews or canonical venue IDs.

The user explicitly deferred creating/linking canonical onboard restaurants, bars,
shops and other venues. Later, each should open ordinary place details with its own
appropriate review taps, remain linked to its ship, and keep venue reviews separate
from ship reviews. This is pending, not part of the cruise discovery release.

## eCard organization and approved offer

The live design inventory remains 21 layouts and 123 palettes. Preserve IDs, saved
cards and customer media; real politicians and businesses are never sample templates.
All 21 iPhone Simulator Safari template captures plus finishing follow-ups exist;
these are web template evidence, not native App Store screenshots.

Category reorganization is in progress: Business & Services; Personal & Creators;
Food & Mobile Businesses; Real Estate; Faith & Community; Politics & Public Service.
The current creation default mixes all categories while internally selecting Business.
The prepared fix separates browsing categories from persisted card types and introduces
a separate Free/Pro filter. Root review found two purpose-mapping issues, being corrected
before integration. This cleanup is not live at this checkpoint.

The user has now approved unlimited basic links on Free and at least one polished Free
design in every category. This supersedes the prior five-link rule. Pro retains premium
designs, galleries, embedded videos, forms and professional credentials. Existing eCard
prices remain $4.99/month or $39.99/year. Implementation and persistence/publishing
verification are pending; do not advertise the new limits as live yet. Preserve existing
published content and palette rights while aligning creation, editing and publishing.
Restaurant membership remains a separate offer with unresolved final pricing.

## Mobile and Apple

- Latest uploaded internal iOS preview remains 1.0.1 build 26 from an older 616-file
  snapshot. No App Store submission has been made. Updating the website does not
  update that installed native binary.
- Native 687 passed actual English/Portuguese/Spanish navigation checks on iPhone and
  iPad. Native 688 adds Cruise category/Tools routes and the shared directory header;
  app typecheck, two directory behavior tests and configured Xcode build passed.
  Actual688 Simulator navigation verification is underway; it is not EAS uploaded.
- Public connection settings are verified in the binary and privileged server keys
  checked absent. Compilation alone is insufficient release evidence.
- Eighteen native 681 Store candidates and thirty-two newer 687 QA screenshots exist.
  Some Atlas captures with untranslated system categories remain QA-only. Final
  screenshot selection must match the eventual submitted build. Full 17-language and
  RTL workflow coverage is incomplete.
- Earlier Apple navigation/sign-in checks passed on iPad Air 11-inch M4/iOS 26.5,
  not the original M3/iPadOS 26.2 review configuration.
- Genuine account deletion remains an Apple release blocker. Backend 016 is disabled
  preparation only. A separate truthful web/native UX overlay fixes a missing route
  and unsupported deletion promises; it is prepared, not deployed. Digital-purchase
  compliance, final native safety/playback checks and review instructions remain.

## Provider reviews and public privacy

Backend 014 review safety and 015 additive domain vocabulary are committed and exact
postchecks passed. Provider/realtor UI and runtime vocabulary changes remain prepared.
Legacy star ratings must not be converted into invented four-part tap evidence.

Projection 017 is not installed. The user approved its production rollback test; the
first run failed before fixtures because an obsolete trigger references a missing
table. Read-only postchecks confirmed no retained migration, objects or synthetic
records. Repair preparation and a new rollback gate are required before coordinated
backend/Edge/web/native release. Do not restore public access to private owner fields.

## Search migration

The replacement import stopped safely at 22,795,674 acknowledged records out of
34,883,915 after reaching its reviewed transport-ambiguity limit. The original search
continues serving traffic. Fresh read-only reconciliation confirmed the pending 2,000
records absent and preserved the exact journal/source-hash chain. A reviewed bounded
continuation is being prepared; never reset the target or replay acknowledged batches.
Full target/configuration verification, permissions, persistence, producer reconciliation
and traffic switch remain incomplete. Private cost and deadline gates still apply.

## Other pending work

- Finish domain-specific provider tap writing/aggregation using real identities.
- Finish On The Go expiry scheduling and non-food owner features.
- Implement real preference persistence where Settings only changes component state.
- RV offline maps require a provider permitting downloads; offline routing is separate.
- Complete global overnight cruise research and language/native release work.
- Atlas full voices are verified for Los Angeles, Chicago and Nashville; older audio
  presence checks do not establish complete narration for every article.

Further TDM/Aline card work and the attributed RV-article search were closed by the
user. Do not reopen them. Update this handoff after each verified release and retain
private manifests/receipts outside the public repositories.
