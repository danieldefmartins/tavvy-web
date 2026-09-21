# Tavvy project memory

Updated September 21, 2026, America/New_York. This is the current product and
engineering handoff. Read [PROJECT_STATUS.md](PROJECT_STATUS.md) for release status
and remaining work. Update both documents as decisions and releases change.

## What Tavvy is

Tavvy helps people decide whether a place or service fits what they need. Structured
review taps, recent evidence, atmosphere, practical information, photos, stories and
direct business links should answer useful questions that a single star average cannot.
Search is a central product capability. Simple discovery and clear place details are
more important than adding more screens or controls.

The product includes place discovery, restaurant owner tools and Tavvy Menu, eCards,
Universes, Cities, Atlas, On The Go, RV & Camping, rides, Pros and Realtors. Overnight
cruise ships are an approved expansion with their own verified catalog and reviews.
Feature presence in source does not establish that its full workflow is released.

## Repositories and architecture

| Repository | Responsibility |
| --- | --- |
| `tavvy-web` | Next.js web app, public pages, web owner/editor flows and API routes. |
| `tavvy-mobile` | Expo / React Native app and native navigation, editors and device behavior. |
| `tavvy-admin-portal` | Administrative and moderation workflows. |
| `tavvy-review-agent` | Scheduled content/search producer jobs. |

Web and mobile share Supabase-backed product data. Typesense provides large-scale
place discovery. Web production is hosted on Railway; mobile preview builds use Expo
EAS. Existing Mac Mini jobs are separate deployment targets. Releasing the website
does not release a native build, a database migration, an Edge Function or a producer.

Web uses Next.js 14 Pages Router, React 18 and TypeScript. Mobile uses Expo 53,
React Native 0.79 and React 19. Check the repository's package and lock files before
installing or changing dependencies. Do not casually align the two React versions.

Useful web source areas:

- `pages/app/`: signed-in/discovery application routes and tool entry points.
- `pages/app/place/[id].tsx`, `pages/api/place/[id].ts`: place details and data access.
- `pages/[username].tsx`: public eCard lookup and page.
- `pages/app/ecard/`, `components/ecard/`, `lib/ecard/`: creation, editing and preview.
- `config/eCardTemplates.ts`: template and palette identities.
- `pages/api/search.ts`, `lib/searchIntent.ts`, `lib/placeSearch.ts`: search behavior.
- `lib/placeEvidence.ts`, `lib/placeReviewSummary.ts`: evidence and review summaries.
- `pages/place/[id]/`: owner, menu and ordering surfaces.
- `public/locales/`: language catalogs; `contexts/ThemeContext.tsx`: app appearance.
- `supabase/`: migrations and Edge Functions; application deployment is a separate step.

Useful mobile source areas:

- `App.tsx`, `types/navigation.ts`: navigation registration and route contracts.
- `screens/PlaceDetailsScreen.tsx`, `screens/HomeScreen.tsx`: place/search entry points.
- `screens/ecard/ECardNewScreen.tsx`, `screens/ecard/ECardEditScreen.tsx`: current card
  creation/editor entry points; check which route is active before editing an older screen.
- `components/ecard/`, `lib/ecard/`, `config/eCardTemplates.ts`: native editor and shared
  template contracts; Studio preview uses the shared web renderer through its bridge.
- `i18n/locales/`, `contexts/ThemeContext.tsx`: language and app appearance.
- `app.json`, `eas.json`, `ios/`: app identity, EAS profiles and native configuration.

Reviewed application source handoff branches and relative-file manifests are listed in
the status file. A source candidate, Simulator binary, production web deployment and
EAS upload are separate release states. Preserve those distinctions.

## Product decisions to preserve

### Reviews and place details

The intended four-part summary is **The Main Thing**, **The Good**, **The Vibe** and
**Heads Up**. The first tile represents the core experience: food for a restaurant,
sleep for a hotel, and an appropriate equivalent for other domains. It must be based
on actual matching review evidence. Free-text reviews are not automatically classified
into the core experience by an implemented AI pipeline.

Reviews belong prominently on the main place overview. Avoid repeating a complete
review section on both Overview and Reviews, or duplicating the same Main Thing in
multiple blocks. Keep the review grid near the top, alongside an understandable
summary and the most useful actions. Tabs organize additional information.

Concerns should become less prominent only with elapsed time, enough independent
later evidence and no recurrence. Silence alone does not establish that an issue was
fixed. Preserve the dated review history. Existing evidence rules use a 180-day window,
five later independent reports for ordinary fading and three mapped opposite reports
for signs of improvement. These are implemented starting thresholds to validate,
not a claim that the business has definitively fixed an issue. Serious safety,
accessibility, discrimination and harassment concerns need separate treatment.

Use domain-specific wording in previews, details and review entry. Realtor style can
describe communication, negotiation and involvement. RV overnight parking differs
from a campground or dump station. Rides here means theme-park attractions. Never
invent reviews, counts, ratings, verification badges or business details to fill gaps.

Place details should bring together phone, website, social links, directions, actual
ordering/delivery links, the full Tavvy Menu, stories, media and the business eCard.
Only show merchant integrations that really exist. Missing places should be addable
within restaurant onboarding, preserving the user's current context.

### Search and navigation

An explicitly searched destination takes precedence over device location. A query
such as Italian restaurants near Boston must not silently return the user's current
city. Named-place matching, category recognition, honest failures and clear location
feedback are essential. Preserve browser Back state and validate draggable results
sheets with touch/scroll interaction, not just desktop clicks.

### Appearance and tools

Follow the device's appearance by default and retain System / Light / Dark choices.
Use understandable text controls, accessible through Tools and Profile, rather than
depending on sun/moon symbols alone. The chosen theme applies to all app tools and
owner/editor chrome; an eCard's own design remains independent of app appearance.

Universes is the reference for consistent tool headers. Cities, Atlas, On The Go and
RV & Camping should follow the same navigation and layout language. Tools should be
easy to discover from the footer. Preserve useful features while simplifying access.

### eCards

Preserve all existing functionality, every template and saved design, palette IDs,
prices, links, hidden states, QR/export/wallet/NFC tools and customer content. The
current design inventory is 21 layouts and 123 palette choices; the web/mobile union
is additive. Do not delete an existing ID because another platform omitted it.

The latest desired creation flow starts with choosing a polished design, then adding
the user's information. Keep Quick setup and the full type/country/template path.
Preserve entered values when switching designs. Template examples must be complete
and attractive, using fictional identities and appropriate portraits/backgrounds.
Real politicians, people and businesses are not template assets.

Previews should use the actual public renderer at a 9:16 phone ratio. Unsaved editor
previews must not publish, submit forms, increment public analytics or trigger real
customer actions. Remaining imitation previews still need replacement. Capturing
existing cards in iPhone Simulator is distinct from finishing every template preview
and adding the final chooser presentation.

The six approved usability improvements cover clear save/error states and save-before-
publish, shorter setup with the full path preserved, easy Links & actions/reordering,
better Edit/Preview and mobile Publish access, and clearly grouped advanced controls.
Saved link identity and hidden content must survive changes.

Keep the Free allowance of five active links. Galleries, embedded videos, forms and
professional credentials are Pro extras with labels before addition; existing published
content remains intact. Existing web Pro pricing is $4.99/month or $39.99/year.
Restaurant membership is a separate offer whose final pricing is unresolved; do not
reuse Tavvy Pros billing for it. New eCard features and pricing changes require a decision.

### Other tools

- **Tavvy Menu:** retain the full native product, with elegant off-white, text-first
  options and optional image gallery mode on every menu.
- **On The Go:** canonical place details plus mobile-business location, verified live
  session, schedule, service area, current offerings, menu, stories and owner controls.
  A fixed business address is not proof of a live mobile location.
- **RV & Camping:** retain existing canonical park/campground records. Improve finding
  them instead of recreating them. Offline maps remain a separate planned capability
  requiring a tile provider that permits downloading; offline RV routing is separate.
- **Cruises:** include overnight ocean, river and expedition ships; exclude private
  charters and day trips. Verify identity, dimensions/capacity, years, decks, dining,
  shopping and entertainment, preserving unknown values and source dates. A ship can
  contain canonical onboard venues through a Universe-style hierarchy.
- **Atlas:** readable Light / Sepia / Dark themes and text size, discoverable reading
  controls, and complete audio for both voices. There is no verified evidence of a
  previously shipped font-family selector in the history examined.

## Languages and Apple release

The repositories contain 17 language catalogs. Current screenshot priority includes
English, Portuguese and Spanish. New workflows must be checked for visible copy,
fallbacks and RTL where applicable; catalog key coverage alone is insufficient.

The earlier Apple review reported unresponsive Account, RV & Camping, Universes,
Realtors and Saved buttons and asked where personal sign-in is located. Check every
route on iPad and give instructions matching the actual final build. A simulator
check on a different device/OS is useful evidence, not an exact reproduction.

Final iPhone and 13-inch iPad screenshots, account deletion, UGC moderation/blocking,
digital-purchase compliance and release-language checks remain release gates. An EAS
internal preview is not an App Store submission. Review replies and store submission
are separate actions.

## Working and release habits

Use the local package scripts and focused behavior tests for the changed area. Verify
the actual browser/native experience for visual and navigation work. Keep frozen
source manifests, deployment receipts, screenshot indexes and explicit limitations.
Deploy complete batches incrementally. Use owner-scoped writes and preserve real data.

Record what is **live**, **tested locally**, **prepared**, **blocked** or **not implemented**.
Do not infer completion from a filename, a past plan or a migration that only passed
a rollback test. Update the Git handoff after each completed release; keep confidential
operational evidence with the maintainer, outside this public repository.

Review writes and account deletion must preserve the distinction between current Auth
identities and legacy user records. Never manufacture a legacy account or assume matching
email addresses establish identity. Validate fresh-account writes as well as public reads.

Live On The Go actions distinguish Auth actors from legacy user identities. Session
starts are enabled; public GPS requires a confirmed, active, unexpired session.
Administrative disabling requires an actual unexpired administrator role and an atomic
audit record. Preserve terminal disabled history and the separate Auth attribution.

Local native builds must include the approved public connection settings explicitly.
A successful Xcode compile alone is not a release gate: verify the actual bundled
configuration, sign-in, retained form values and preview navigation. Keep private server
credentials out of every client bundle.
