# Tavvy current engineering status

As of September 21, 2026, 04:15 America/New_York (08:15 UTC).
Read [PROJECT_MEMORY.md](PROJECT_MEMORY.md) for product decisions and architecture.
This checkpoint distinguishes live features, local verification and remaining work.
The full requested release is not complete.

## Source and release warning

The active main workspaces contain unrelated unfinished work. Reviewed application
source is now separated on `release/verified-web-20260921` and
`release/native-preview-20260921`, with relative-file SHA-256 manifests under
`docs/release-manifests/`. The web branch contains the reviewed search/account and
owner/menu batches; the mobile branch is a preview candidate, not an uploaded build.
Historical marketing captures are preserved separately and are not final Store assets.
Do not deploy a mixed working directory or replay a migration based on its filename.
Use the live/prepared status below and the maintainer's exact private release receipts.

## Live releases

The current verified web build is `9vk2EoKB74_bQtxf_R9m0`. It includes the earlier
appearance, place-sharing, eCard gallery, tools, cruise, community-safety, On The Go,
Atlas audio and English/Portuguese/Spanish creation-copy batches. The current admin
release includes verified review-author resolution. Both deployments succeeded. Search/account copy is now live and passed 23 deployed
browser checks using controlled provider fixtures. Read-only live batches cover all
342 cruise detail pages and sharing metadata, public tools and anonymous admin denial.
The latest catalog batch passed 141 HTTP checks with no customer writes.

| Area | Delivered and verified | Remaining limits |
| --- | --- | --- |
| Appearance and tools | Device / Light / Dark choices, accessible appearance controls, larger logo and Universe-style headers across ten web tool routes. | Final native checks and all new workflow translations remain. |
| Place sharing | Place-specific title, category/subcategory, location and designed image treatment; actual 1200×630 output checked. | Broader Arabic/CJK image font coverage remains. |
| eCards | Design-first creation, Quick setup and full type/country path; all 21 layouts and 123 palettes; fictional examples; actual public renderer in 9:16 previews; preservation of entered and saved content. | Native release, remaining legacy preview paths and final language checks remain. |
| Template evidence | All 21 actual iPhone Simulator Safari gallery captures and three latest finishing follow-ups completed and visually checked. | These are web template captures, not native App Store screenshots. |
| Review summaries | Four-part grid in search, RV, On The Go and canonical details; category-specific core matching and deduplicated taps. | Pros/Realtors and other provider-specific paths still need a complete real-evidence audit. |
| Review identity | Separate current Auth authorship preserves legacy identities. Fresh-account writes, old-client insert compatibility, readers, moderation identity and evidence visibility passed database rollback gates; exact migration and permissions verified after commit. | No production customer review was created for testing. Older raw user-ID queries cannot infer new Auth ownership. |
| Community safety | Reporting/blocking and admin moderation released; hidden or blocked content excluded from appropriate feeds. Admin authorization uses actual current role grants. | Native release and operational signed-in moderation checks remain. |
| On The Go | Discovery, canonical details, owner schedules/cancellation and live lifecycle are released and enabled. Public locations require active, unexpired, address-confirmed sessions. Admin disabling now uses actual Auth/role checks and atomic audit attribution. | No real merchant session was disabled for QA. Expiry cleanup scheduling and remaining non-food owner-feature coverage need follow-up. |
| RV & Camping | Existing canonical places retained; category filtering before pagination, stable load-more and domain review vocabulary released. | Final native checks; offline map downloads and offline RV routing are not implemented. |
| Atlas | Complete female/male recordings verified for Los Angeles, Chicago and Nashville; usable duration, seek, speed, voice switching, retry and unavailable states released. Reading themes and text size preserved. | Older recordings were checked for presence, not all for full transcript coverage. Final native playback checks remain. |
| Atlas producer | Complete-article, validated, missing-only producer installed in the existing daily job. Prior schedule/load state preserved without an immediate run. Offline tests and a read-only article audit passed. | No claim that every old recording has been regenerated. |

### Cruise catalog

342 verified ships are published across 21 operators: 181 ocean, 149 river and 12
expedition ships. This includes 1,713 sourced venues, 60 cabin categories and 71
programs. Unknown facts remain unknown; conflicting values are withheld from display.
No unverified ship photos, customer reviews or canonical venue links were invented.
All 342 public pages and ship metadata passed live HTTP checks.

The latest 124 Viking and AmaWaterways ships passed collision checks, the actual
database rollback rehearsal, committed publication, exact anonymous projection checks
and all 124 public pages. The preceding Carnival, Princess, Costa and Disney batch is
also verified. Further overnight fleet research is underway; worldwide coverage remains
incomplete. Staged JSON retains its research draft state; see the catalog manifest for
the published batch set, and never replay those imports.
Future launches and ownership/name transitions require dated status evidence and
identity reconciliation, rather than treating every marketing page as an operating ship.

## Mobile and Apple

- Latest uploaded internal iOS preview remains version 1.0.1, build 26, from the older
  616-file snapshot. No App Store submission has been made.
- The correctly configured 664-file Simulator build passed actual sign-in, one Free
  unpublished eCard draft save, real preview, Close-button safe area and exact entered
  name/title retention. Portuguese and Spanish Settings/creation checks passed.
- Earlier compilation-only local builds omitted public connection settings and are
  invalid release evidence. Use the configured build receipts. Public client settings
  are checked in the actual bundle; private server credentials must remain absent.
- The configured 681-file snapshot passed actual iPhone/iPad navigation and preview
  checks. Saved opens its real destination, statistics without routes remain readable
  text, and version comes from app metadata. It includes Atlas, review identity readers,
  status-bar restoration, account copy and search fixes; it is not uploaded.
- Full-display captures establish correct dark preview and landscape rendering.
  Certain XCTest app-only images omitted composited WebView pixels or rotated content;
  those marked capture artifacts must not be used for marketing or regression claims.
- The 685-file source candidate adds owner request guards and passes app typecheck plus
  nine focused tests. It has not yet been built or tested as a native binary.
- Earlier Account, RV & Camping, Universes, Realtors, Saved and sign-in navigation
  checks passed fresh-install and update paths on iPad Air 11-inch M4 / iOS 26.5.
  This is not Apple's original M3 / iPadOS 26.2 review environment.
- Final native iPhone and 13-inch iPad App Store screenshots remain incomplete.
  Prioritize English, Portuguese and Spanish, then verify remaining supported locales
  and RTL. The presence of 17 catalogs does not prove every new label is translated.

### Remaining Apple release gates

Account deletion is not deployed. The older draft does not match current Auth/legacy
identity boundaries or shared business/payroll retention requirements. A complete
schema inventory and narrower durable-job design are prepared; cleanup, billing and
provider-token handling still need implementation and verification. Settings copy must
describe actual behavior rather than promise unimplemented deletion or cancellation.

Resolve digital-purchase behavior across storefronts, finish native community-safety
checks, verify public support/privacy links, prepare accurate personal sign-in review
instructions and create the final internal/production builds. A preview upload,
browser template capture and App Store submission are separate deliverables.

## Search

The preserved import continuation has passed 18 million of 34,883,915 records with
no unresolved write outcomes at this checkpoint. The original serving search remains
active. The immutable full-backup content-hash ledger is complete. Do not restart the
writer, reset the target or replay acknowledged batches. Any interruption requires
exact checkpoint reconciliation before resuming.

Migration gates still include complete target content/configuration verification,
permissions and search checks, restart persistence, producer reconciliation and a
verified traffic switch. The approved costs and overlap review checkpoint remain in
the private runbook. No infrastructure identifiers or credentials belong here.

The product search corrections are live on web and included in the 681 native
candidate. Explicit Boston destinations override device position; near-me clears stale
location filters; real named-place results take precedence over a clearly labeled demo
link. Browser Back/Forward restores searches and list state, and touch swipes expand or
collapse the results sheet while retaining full-height list scrolling. The 23 integrated
and 23 deployed browser checks passed. Safari/device-specific gesture testing remains
distinct from Chromium touch emulation.

## Other work still required

- Owner/menu verification passed full menu/gallery, inline onboarding, profile/contact
  and local-demo workflows. The reviewed web batch fixes false save/delete success,
  missing meal-period persistence, stale account responses, login return and theme-aware
  editor chrome; 46 focused tests, production build and 13 integrated browser checks
  passed. Deployment is in progress at this checkpoint. Real customer records were not
  used for write testing; operational ownership verification remains separate.
- Keep reviews prominent without duplicate complete sections; validate ordinary-issue
  aging against independent later evidence. Do not turn silence into proof of a fix.
- Finalize the separate restaurant membership offer before paid activation. Existing
  eCard prices and approved Pro features remain unchanged.
- Remove known mock/fallback rating and identifier assumptions in provider-specific
  Pros/Realtor paths after mapping their real evidence and canonical identities.
- Implement functional preference persistence where Settings currently only keeps local
  component state; localization alone does not make a setting functional.
- Select an offline-capable map provider and confirm downloading rights before claiming
  RV maps work without a connection. Routing is a separate capability.
- Continue the verified cruise inventory and native/language release.

The attributed RV-article search and further TDM/Aline card work were closed by the
requester. Do not reopen them or substitute personal cards for requested articles.
Real people's cards remain separate from fictional template examples.

## Handoff discipline

Update both repositories after each verified release. Keep frozen source manifests,
deployment receipts and screenshot indexes with the maintainer. Preserve all existing
features, templates, prices and customer data. State what is live, locally tested,
prepared and incomplete; never infer completion from a source edit or rollback test.
