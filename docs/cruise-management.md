# Cruise management

The admin portal has a dedicated **Cruises** section and a link from **Universes**.
It lists all ship records, including drafts and archived ships. Search and cruise-line,
cruise-type and publication filters apply before pagination. Public discovery only
shows ships that meet the catalog's publication rules. Check PROJECT_STATUS.md for
the actual deployed version; the catalog does not yet cover every overnight fleet.

## Editing a ship

- **Information:** name, cruise line, description, official website, ship type,
  operating status and publication status. Stable ship IDs and registry identities
  are preserved.
- **Photos:** upload a real ship image, add descriptive text and a caption, select
  its order and choose a cover, then Save. Source and permission fields are not
  required for admin uploads. The first upload can be staged as the cover; an explicit
  cover removal remains respected. A stored upload is not shown on the ship page until
  saved for display. The media bucket itself is public. Active registered images
  belong to exactly one ship; historical metadata remains intact.
- **Facts:** maintain sourced dimensions, capacities, dates, decks and amenity counts.
  Keep unknown or conflicting values explicit; previous fact versions remain in history.
- **Sources:** record publisher, HTTPS URL, source type and date checked. Earlier
  sources remain available to preserve references from historical facts and photos.

Save changes includes unfinished source/fact form entries after validation. Concurrent
edits use version checks rather than silently overwriting another administrator's work.
Back/Forward can recover bounded unsaved drafts in memory for the same administrator
and ship after a fresh access check. Closing the tab loses this recovery cache; it is
not a substitute for saving. File uploads and save requests are never replayed by recovery.

## Access and media

Server-side admin authorization and database authorization both apply. Ordinary
accounts and unauthenticated callers cannot read administrative data or mutate ships.
Uploads accept JPEG, PNG and WebP, up to 6 MiB. The server decodes and re-encodes
images, strips metadata and writes a unique path in the existing media bucket.
Captions and public sources can appear publicly; internal rights notes do not.

The public web and mobile ship views consume the same approved gallery. Never use
generated images as documentary ship photographs or invent review activity.

Onboard venues remain sourced ship information. Creating canonical clickable Tavvy
places for them, with individual venue reviews, is now approved. Implementation must
use ship-scoped identity, avoid duplicate places and invented land coordinates, and
keep ship-level and venue-level review evidence separate. Check PROJECT_STATUS for rollout.
