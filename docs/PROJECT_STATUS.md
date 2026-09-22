# Tavvy current engineering status

## Review entry and place imagery — September 22, release candidate

The standard place Add a review sheet had a styled-jsx scope bug: its outer overlay
was unstyled, so clicking the actual place action rendered the form below the page.
The overlay now fills the viewport, keeps its Post action visible and clears navigation.
Signed-out visitors return directly to the review form after login. The standalone
form hides bottom navigation.

Web and mobile now combine duplicate catalog labels and a small explicit synonym list
into one choice, retaining saved IDs and emphasis. Sections expand one at a time;
word search crosses all sections, and selections survive section changes. No catalog
records or review history were deleted. Existing summary labels are not migrated.

Search photos are now 112 × 104 (96 × 96 on narrow web screens). The standard detail
hero uses the same category illustration when real approved photos are missing; real
photos take priority and failed real images fall through to another photo/illustration.
Illustrations remain labeled and are never added to the place gallery or database.

Web production build, both application TypeScript commands, 27 focused unit checks,
and the production-build composer/card browser tests passed. The composer test now
clicks the actual place action after scrolling and checks overlay/footer bounds,
duplicate choices, close behavior and real-photo replacement. Browser writes use
intercepted fixtures. The enlarged native search card was checked in the existing
iPhone development app; no new native/EAS build or production review was created.

Release target: Tavvy.com from `release/verified-web-20260921`; mobile source on
`release/native-preview-20260921`, with distribution still on hold. This entry records
the verified candidate; confirm the deployment before calling the website released.
Full implementation and rules: [Review experience implementation](REVIEW_EXPERIENCE_IMPLEMENTATION.md).

## Search previews — September 21 evening, web released

Search and map previews now put the name, specific category, address and distance before
photos, followed by recent Tavvy experiences and available direct actions. Real place
photos support horizontal galleries. Empty, loading and unavailable review states use
one compact message; available reviews retain the domain-aware four-part grid and
actual recent reviewer counts. Browse cards load the same evidence as place details and
discard responses after their list changes. Google/Tavvy comparison screenshots supplied
by the user informed the hierarchy and reduced header clutter.

Distance remains in meters through provider adapters and place services; conversion happens
at display time. Map/native cards use actual device coordinates when available and
otherwise label the search-origin distance. Zero remains valid and missing/invalid
distances stay hidden. Search projection preserves real photos, address and contact fields.

Web assets contain 130 generated category illustrations across 26 groups (five each,
approximately 8.1 MB total compressed). Their public manifest records prompts and purpose.
Subcategory matching precedes broad categories and selection is stable per place.
Real cover/gallery photos immediately supersede illustrations, which are display-only
and must never be saved into business records. Native uses the web-hosted image library.

Web/mobile TypeScript and six focused distance/photo/review regressions passed.
Local Chrome checks passed for light/dark cards, true counts, all four review sections,
compact unavailable state, gallery scrolling, phone/website links, photo replacement
and map rendering. Map tiles were blocked in the synthetic browser fixture.
Web source `dffb662` deployed successfully through Railway's build and health gate.
Matching mobile source `c55eaf4` is published; native has not been rebuilt.
The subsequent user-approved color adjustment uses the logo's primary purple for
preview action buttons, with white icons/text and 44-point minimum targets.
Its light/dark browser checks and mobile TypeScript passed before publication.
Real opening hours, menu availability, accessibility and other missing business data
are not fabricated. Full translations of the new helper copy remain release follow-up.

As of September 21, 2026, morning, America/New_York.
Read PROJECT_MEMORY.md for product decisions. The full requested release is not complete.

## Release boundaries

The reviewed web and mobile source branches have the user's explicit publication
approval. They are not merged into main. Main workspaces contain unrelated unfinished
work; deploy reviewed snapshots. Source publication, web deployment, native Simulator
verification, EAS upload and App Store submission are separate states.
Relative source manifests are under `docs/release-manifests/`. Never replay migrations
based only on their filenames; obtain private release evidence from the maintainer.

## Current web release

Verified live build: `w9SaMXYfyY0LIBlDDSuY6`. The simplified cruise directory with all
26 official line logos and one Filters control is deployed from reviewed commit
`e1ec9f5`: seven live HTTP checks and 24 live browser checks passed, including touch,
keyboard, themes, filters, pagination and Back state.

The preceding cruise photo/Stories update (`kgb4gXgRxNZrraBUwSWBt`) is retained
from reviewed web commit `79a17b8`. Seven live HTTP checks, 13 photo browser checks and
16 Stories browser checks passed with the exact live build; no real records were changed
by those browser checks. The registered uploaded ship photo appears in the live page
and share metadata. This replaces `8AyFMYKC7PMLjYfxoIweN`, whose earlier cruise/eCard
release passed the following checks. Local production browser checks
passed 17 cruise, 18 eCard and two fully rendered 9:16 previews; all three suites
also passed against the deployed build. Ten live HTTP checks and three read-only
catalog checks passed. Browser data/write fixtures did not mutate real records.

The currently live release includes Cruise discovery through the Universe categories
and Tools, with Ocean/River/Expedition filters. Fourteen deployed navigation checks and
public route/health checks passed. Preserve Docker runtime-copy ownership: missing
ownership caused an earlier failed startup, and the corrected replacement is healthy.

Earlier live work includes destination-aware search, browser history/list restoration,
touch search-sheet improvements, owner/menu save integrity, inline restaurant onboarding,
full Tavvy Menu, appearance controls, place sharing, eCard previews, tool layouts,
community safety, On The Go and Atlas. Public Discover/RV/Atlas/review fixed labels have
41 added keys in 17 catalogs. Full workflows are not completely translated.

## Cruise catalog and administration

376 verified ships across 26 operators are published: 209 ocean, 149 river and
18 expedition ships, with 2,081 sourced venues, 60 cabin categories and 71 programs.
Catalog batches 001–006 passed collision, rollback, publication and public projection
checks. Worldwide overnight fleet coverage remains incomplete. Do not invent missing
facts, photos, reviews or venue identities.

Backend 019 is installed and postchecked. It provides full cruise-line facets and
server-side composed filtering before pagination. The live web release adds a
searchable company picker, retained filters and a curated Featured ships row. Featured
is editorial selection, not a popularity or review ranking, and respects active filters.

Backend 020 is installed and postchecked. Admin authorization, atomic versioned edits,
private image metadata, public gallery projection and protected upload paths passed
29 actual-schema rollback checks and independent cleanup checks. No synthetic customer
records or uploaded test images were retained.

The dedicated admin ship editor is live at https://admin.tavvy.com/cruises, version
`2026-09-21-cruise-photo021` (updated from admin020). It includes all statuses,
search and filters, Information/Photos/Facts/Sources tabs, cover/gallery management and
in-memory unsaved-draft recovery. Production UI checks 28, cache checks 12 and focused
server/image checks 13 passed. Railway Linux image decoding/re-encoding, live health,
assets and version checks passed; unauthenticated cruise queries return 401. No real ship
records or photos were changed for deployment testing. See [Cruise management](cruise-management.md) for the workflow. Public web/native
gallery rendering is live on web and included in the mobile candidate.

The user approved canonical onboard restaurants, bars, shops and other places with
separate venue reviews on September 21, superseding the earlier deferral. Architecture
and identity/visibility checks are underway; venue creation is not implemented yet.
Ship reviews must remain separate from venue reviews.

## eCard organization and approved offer

All 21 layouts and 123 palettes remain. Creation browsing is organized as Business &
Services; Personal & Creators; Food & Mobile Businesses; Real Estate; Faith & Community;
Politics & Public Service, with a separate Free/Pro filter. Browse categories do not
replace persisted card types. Political designs stay out of business-only selection.
The live web release fixes repeated category/plan selections and preserves entered
information, hidden links and saved link identity.

Backend 018 is installed: 33 actual-schema checks, rollback cleanup, rehearsal and
exact post-install checks passed. Free has no plan-based basic-link limit; requests
have a 1 MiB resource bound. At least one Free design is available in every category,
including the specifically approved Agent and civic palettes. There are now 10 Free
designs and 26 Free palettes. Pro retains premium designs, galleries, embedded videos,
forms and professional credentials. Existing prices remain $4.99/month or $39.99/year.
Creation, editing, persistence and publication use the approved design rules.
The offer is live on web and passed native iPhone/iPad verification. The native705 internal cloud build finished successfully; the physical-device IPA is available.
Preserve existing published content and customer media.
Restaurant membership remains a separate offer with unresolved final pricing.

## Mobile and Apple

- Native705 was uploaded for an internal iOS preview build on September 21. Expo
  accepted build `dd0a579c-31dd-4d46-b55e-2f87b7cbb816`, version 1.0.1 build 26;
  status FINISHED. The physical-device IPA download was verified with a bounded read.
  This is not evidence of installation on a physical device.
  No App Store submission has been made.
- Native 688 Cruise entry/navigation passed on iPhone and iPad. The new 705-file
  candidate includes the current Cruise, eCard, Atlas taxonomy and truthful account
  deletion UI work. Typecheck, 23 focused handler checks and configured Xcode build
  passed. Actual testing caught a Photos & stories raw-text crash in the earlier 704
  candidate. Native 705 fixes it, including a regression that failed before the fix.
  All required English Cruise, Photos & stories, Back/filter/query, chooser-repeat,
  preview Close and exact unsaved-input retention cases passed on both iPhone and
  iPad. The initial input test dropped simulated keystrokes; a corrected targeted
  test verified the exact value both before navigation and after return without any
  app change or draft creation. Existing EAS preview connection settings passed
  the actual installed client read checks; no configuration changes were needed.
  Exact source and device-QA receipts were verified before the internal upload.
- Public client settings were verified in the binary; privileged server keys are absent.
- Native 687 has 32 screenshots, including 28 Store candidates and 4 Atlas QA-only
  captures. Final screenshots must match the submitted binary. Native705 adds 12 archived frames: 4 English chooser candidates and 8 Cruise QA
  captures. These are not a complete final Store screenshot set.
- Full 17-language/RTL coverage remains incomplete; several new flows use English
  fallback outside EN/PT/ES. Atlas category label translations are in the current web release and native candidate.
- Earlier Apple navigation/sign-in checks used iPad Air 11-inch M4/iOS 26.5, not the
  original M3/iPadOS 26.2 review configuration.
- Genuine account deletion is still an Apple blocker. Backend 016 remains disabled
  preparation. The new UI truthfully reports unavailability and does not sign out or
  promise completion. Deletion, retention, billing and Auth cleanup are not implemented.
- Digital-purchase compliance, final device/safety/playback checks and review
  instructions remain. Internal EAS approval is not App Store submission approval.

## Providers and search

Provider backend 014 safety and 015 vocabulary are installed. Projection 017 passed
43 actual-schema rollback checks after an exact repair to an obsolete trigger;
independent checks confirmed all synthetic changes rolled back. **017 is not installed.**
Its coordinated web/native/Edge rollout and typed four-part review write path remain
pending. Do not convert old stars into invented tap evidence or expose private owner data.

The reviewed search import continuation is running from its verified checkpoint.
Original search remains live. Never reset the replacement or start a second writer.
Full target verification, permissions, restart persistence, producer reconciliation and
traffic switch remain pending. Private cost, deadline and ambiguity limits still apply.

## Other pending work

- Complete worldwide overnight fleet research.
- The user removed mandatory source/permission steps for admin cruise photo uploads.
  Backend021, admin and web are live; native706 passed configured iPhone/iPad checks.
  Historical metadata remains intact and ship factual verification remains separate.
  Existing EAS705 does not contain this new photo-publication change.
- StoriesRow scope corrections are deployed on web and included in verified native706,
  with 18 component regressions and 16 live web browser checks passing. They preserve
  empty Universe results and reject stale scope/account responses. Native706 has not
  been uploaded to EAS.
- Complete On The Go expiry scheduling and non-food owner features.
- Persist remaining Settings preferences that currently only change component state.
- RV offline maps need a provider permitting downloads; offline routing is separate.
- Atlas full narration is verified for Los Angeles, Chicago and Nashville; audio
  presence alone does not prove complete narration for every article.

Further TDM/Aline card work and the attributed RV-article search were closed by the
user. Do not reopen them. Keep operational logs, credentials, customer exports and
private release evidence outside the public repositories.

## Cruise completion checkpoint — September 21, later morning

Active implementation is now focused on cruise fixes and complete catalog/content
coverage. The user approved onboard canonical places and reviews; other new feature
implementation is paused while the already-running search copy continues.

Backend021 is installed:46 actual-database rollback checks, independent cleanup and
10 exact post-install checks passed. The simplified admin photo editor is live as
`2026-09-21-cruise-photo021`; production build, health, version, assets and anonymous
authorization checks passed. Photo source/permission fields are no longer required.
Historical metadata is preserved without inventing verification claims.

The new web photo/Stories client is deployed and passed its live checks. Railway
archive transfers failed before compilation; fetching the exact reviewed Git commit
through the existing repository connection succeeded. A configured native706 build and 32 native tests passed. Actual
iPhone and iPad checks also passed: the real uploaded photo appears in the directory,
hero and gallery, Photos & stories opens correctly, and Back preserves the ship filters.
Eight original Simulator screenshots are archived. This is separate from completed
internal EAS705; native706 has not been uploaded to EAS.

The horizontal cruise-line logo strip and unified Filters control, with all 26 official
operator logos, is deployed on web and passed 24 live browser checks. Native737
portrait iPhone/iPad workflows passed with 13 actual captures and all 26 bundled
logos verified. Landscape remains unverified: the existing app stayed portrait before
the modal opened, so no orientation policy was changed. No native737 EAS upload. Fleet/image/fact completeness is
not yet established. Current inventory remains376 ships across26 operators.


## New admin photo actions — in progress

The user approved drag-and-drop and multi-file uploads, confirmed Delete photo, and
automatic gallery saving after uploads. This supersedes the earlier staged-upload
Save requirement. Backend/admin023 implementation is isolated and not deployed yet.
Deletion must clear the matching cover and remove the stored file, with explicit
cleanup status if storage fails. Successful photo operations must preserve unrelated
unsaved information/fact/source edits. No actual customer photos are deleted for tests.

## Cruise discovery filters — September 21 afternoon

Web cruise directory now offers sourced ship-length and build-year bands, plus official-line family-activities and adults-only (18+) choices. These audience choices describe programs and booking policy, not guest-rated quality. Unknown/unverified facts do not match. The public v3 database reader filters before pagination; v2 remains for older clients. The six verified editorial starting ships lead Explore ships when there is no name search. Web commit `179597e` is live as Railway deployment `1ae20a56-c55e-447d-8a76-9009d8ae282e`. A live phone-width browser check passed first-six order, active chips/URL, combined empty state and adults-only results. Some combinations are empty because catalog fact coverage is incomplete. Matching mobile source is published at `5bde784`, with app TypeScript passing, and internal iOS EAS preview `fa50ec07-8d30-4439-ace0-5974c36baf54` finished successfully. Final device QA and App Store release remain pending.

## Homepage search location parity — September 21

The earlier two-field homepage release was corrected at the user's direction. The main search field now accepts a destination in the query; explicit named cities take precedence over GPS, and nearby searches retain device coordinates when available. The separate Where input and duplicate Saved shortcut beneath search were removed on web and in mobile source. Web TypeScript passed. Web commit `daed66d` deployed as Railway `b7e8bf1f-ca76-4cf5-91da-e5da8699d99a` SUCCESS; public app/search routes and health returned HTTP 200. Mobile source has no HomeScreen TypeScript errors, but the full native typecheck has unrelated test/Deno type errors. Do not claim the mobile correction is in a binary: the user asked to wait for more changes before another Simulator build.

Follow-up search scope correction is live as web commit `17f69f5`, Railway `8c92c550-2fbe-4694-8e20-c51571ffc778` SUCCESS, public health HTTP 200. A newly typed unqualified query no longer inherits a prior map area; the web results page requests current coordinates when needed, and a denied location produces a clear message instead of a worldwide search. Fifteen focused intent tests and web TypeScript passed. Matching mobile source `eb40239` passed the same fifteen tests and has no changed-file TypeScript errors; it remains unbuilt under the user's request to collect more changes first.

## Persistent search cutover — September 21

The public Typesense host now proxies to the persistent replacement over Railway private networking. All 34,883,915 documents passed the exact backup-ledger comparison before cutover. Replacement restart persistence, search, scoped-key permissions and public proxy readiness passed; the replacement and proxy deployments are healthy. Tavvy's public named-city and nearby search API probes returned expected results after cutover. The five-minute search health cron was restored. The prior notes saying the original ephemeral index still serves traffic are historical.

The local full backup remains the verified portable recovery copy. Railway daily and weekly incremental volume snapshots are now scheduled, and an immediate post-cutover snapshot is listed against the approximately 11 GB persistent index. Search readiness stayed healthy after the snapshot. Railway snapshots restore only within the same project and environment; no restore drill has been performed. The existing nightly configuration backup alone does not cover the whole document set. The Mini writer remains unloaded and must not be started without a separate verified reconciliation. Private verification receipts and infrastructure identifiers are retained outside this public repository.

## Canonical onboard cruise venues — September 21

Cruise venue migration 022 passed a live transaction rollback gate and 24 exact post-install checks. All 2,081 verified catalog venues were linked in batches of at most 100 to 2,081 distinct canonical places. The final read verified every place's ship-specific provenance, public context and visibility, with zero cross-ship memberships. No review or image was fabricated.

The web venue client is live in Railway deployment `69e6e2a2-d373-4dc1-b100-9ae40f8fdf56` from source commit `147d00c`. Web TypeScript and 11 focused handler/contract tests passed. Public health, a verified ship page, its venue page and venue API returned HTTP 200 with matching venue data. The matching mobile source is published at `f2d0a8a`; 25 focused tests and application TypeScript passed. It is not in a new Simulator/EAS build under the user's instruction to consolidate changes first. Complete device QA, review-submission QA and venue media visibility audit remain open.

## Pros/Realtors privacy release and indexed place repair — September 21

Provider projection migration 017 v2 passed a live 43-check rollback gate, a no-fixture ledger rehearsal and ten post-install checks. The public view exposes active profile fields, while raw private rows remain restricted. Web source `00e7f9e` deployed successfully, and the three read-only Pros Edge functions were updated with their original JWT verification settings. A live publishable-key check found an invalid bearer-forwarding bug; the corrected functions now return public search, Featured and exact-slug detail successfully. The reviewed web/mobile source tests and TypeScript passed. Matching mobile source is published at `bc37ae2`, not yet in a new binary; provider review submission and native device QA remain open.

An FSQ result with an indexed identity but no row in the older `fsq_places_raw` table previously returned 404 on detail. Web commit `1fd0c6b` now performs a bounded, exact-ID read-only index fallback. Railway deployment `a0e2e66e-a424-4ba5-beb9-6a6488ec8985` is healthy. The reported Immigration Desk URL returned HTTP 200 from the API and rendered its details in Chrome. Two focused fallback regressions, existing cruise handler tests and TypeScript passed. Missing source fields remain absent rather than being invented.

## On The Go session expiry — September 21

The lifecycle expiry function was installed but had no production scheduler. Migration 028 schedules it every minute and also expires legacy sessions that have no Tavvy business ID. A production transaction rehearsal found one expired legacy row, then rolled back both the row change and cron registration before installation. The first scheduled run succeeded, and expired active sessions fell from one to zero. The public read policy also hides sessions past their scheduled end while physical cleanup catches up.

## Pros/Realtors typed review submission — September 21

Migration 029 adds four optional-to-legacy typed tap columns and an authenticated review action. The Main Thing and a written experience are required for new submissions; positive and style taps and Heads Up are optional. The action checks a live provider, blocks owner self-review, validates category-specific codes, and updates one reviewer/provider pair instead of duplicating it. The existing moderated review reader now returns the typed taps. A live transaction rehearsal passed and rolled back before migration installation; four columns, authenticated-only RPC access and unchanged legacy row count were verified afterward. Web and mobile composers use the same catalog; both application TypeScript checks and the web production build passed. Fifteen local browser checks passed, including a synthetic signed-in Realtor submission with typed taps and no fabricated concern. A real signed-in production submission and mobile device check remain open; mobile source is not yet in an EAS binary.

Web commits `cc66cf6` and `b16b23c` were deployed; Railway deployment `778d0ae2-f718-4553-ace7-7084c35b016b` passed health. Public health and an existing Pros profile both returned HTTP 200. Matching mobile source is published at `d1035ab` for integration into the Apple branch; no new binary was built.

A rollback-only production write test created a synthetic auth account, submitted and updated its review as `authenticated`, confirmed one reviewer/provider row with the updated tap and rating, then rolled the whole transaction back. Postcheck found zero synthetic accounts and zero synthetic reviews. Real device interaction remains open.

## Place actions, Back and indexed-only saves — September 21

The shared place layout now puts a horizontal row of actual Phone, Address, Website, Directions, Menu, Reserve, Order, eCard, Share and Save actions directly above “What people experienced”; absent links stay hidden. The place hero no longer duplicates Save. Web place tabs replace their URL entry instead of consuming Back, and the place Back button uses the existing in-app navigation marker rather than raw browser history length. Matching mobile source adds the same action row and a Home fallback when a place opens without a previous screen.

Indexed-only FSQ places previously appeared saved locally without a durable record. Migration 030 adds private user-owned external bookmarks; web/mobile Save and both Saved lists now use it for unpromoted FSQ identities. Its live rollback rehearsal and ownership check passed, with zero test rows retained. Web production build and web/mobile TypeScript passed. Source deployment and device/browser journey verification are next.


## Review experience redesign — September 21 evening

Implemented in this release branch: compact search cards, full topic summaries on
place/cruise details, shared neutral review choices, optional emphasis, preserved
edit history/private notes, and domain-specific provider wording. The web direct
review route now uses the same sheet as the place page. No production schema changes
or synthetic customer reviews were made for this batch.

Verification: web production build and both application TypeScript checks passed.
The focused suite includes distinct-person counts, sparse/older concerns, domain
classification, single-tap removal, category images/distances, RV/On The Go summary
lifecycle and local PostgreSQL review-history tests. Intercepted browser tests cover
place cards, a concern-only submission, failed-save retry with the same request key,
editing with the original date/private note/emphasis, hotel vocabulary, PT/AR,
light/dark mode, provider submission and cruise save/moderation/late-response guards.
The older atomic-review script additionally depends on a private admin migration
absent from this public release checkout; its complete legacy gate was not rerun.
The review-history SQL gate passed using private schema-only fixtures kept outside Git.

The existing iPhone 17 development app loaded this branch's JavaScript through local
Metro. Boston search/results were checked against live read-only services. Native
summary and selection components were also rendered with isolated in-memory fixtures
in light/dark mode; selection/removal worked. The temporary fixture entry was removed
and the normal application entry restored. No EAS upload or native compilation was
started, honoring the user's build hold. This is not final iPad/App Store screenshot
or on-device release-build certification. No real production review was posted.

At this checkpoint source publication and the web deployment receipt are recorded
in the follow-up release entry. The mobile changes need the next consolidated binary;
the 13 remaining locale fallbacks remain part of the Apple language-completion gate.


### Confirmed review rollout

Web source `1c5e8e4` is live: Railway deployment
`f0a9dc24-5eeb-49cf-9a77-6d08e92e6939` completed successfully and passed its health
check. The deployed site passed the compact-card and composer browser checks,
including light/dark, PT/AR, concern-only saves, retries and edit preservation;
all test writes were intercepted. Public health, Boston search, the previously
reported indexed FSQ place and the restaurant demonstration route returned HTTP 200.
The final focused suite passed 29 tests with zero failures.

Matching mobile source `5da4f2e` is published on
`release/native-preview-20260921`. Its application TypeScript check passed after the
temporary native fixture was removed. Native component visual/interaction checks
and the live read-only Boston search ran in the existing iPhone Simulator app.
A new distributed binary, full iPad release QA and remaining-language translation
are still outstanding. Claude's separate Apple readiness branch was not modified.
