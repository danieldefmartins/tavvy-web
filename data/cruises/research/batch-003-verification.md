# Cruise batch 003 — four current fleets

Checked **September 21, 2026**. This is a staged research/import package, **not a
publication record and not worldwide fleet completion**. It leaves the earlier
12-ship and enriched 59-ship batches unchanged.

## Fleet reconciliation

| Operator | Named entries on reviewed fleet page | New operating drafts | Already in earlier batch | Future entries excluded |
| --- | ---: | ---: | ---: | ---: |
| Royal Caribbean International | 31 | 29 | Icon of the Seas | Hero of the Seas, 2027 |
| Norwegian Cruise Line | 21 | 19 | Norwegian Prima | Norwegian Aura, 2027 |
| MSC Cruises | 25 | 22 | MSC World Europa | World Asia, December 2026; World Atlantic, 2027 |
| Celebrity Cruises | 16 | 14 | Celebrity Edge | Celebrity Xcite, 2028 |

Sources are the operators’ [Royal Caribbean](https://www.royalcaribbean.com/cruise-ships),
[Norwegian](https://www.ncl.com/cruise-ships),
[MSC](https://www.msccruisesusa.com/cruise/ships) and
[Celebrity](https://www.celebritycruises.com/cruise-ships) fleet pages, plus each
matching individual ship page. The inventory records every named entry on these
reviewed pages. Current fleet inclusion and public overnight products establish the
catalog scope; they do not claim a ship is physically sailing at a particular moment.

**Norwegian Sky is withheld as an operator-transition case.** It is absent from the
reviewed consumer fleet but remains in corporate material. Primary filings describe
a late-2026 charter, while [Cordelia’s routes](https://www.cordeliacruises.com/routes)
market October 2026 departures. This package does not guess its final NCL sailing,
transfer date or current operator. Older future itinerary announcements do not settle
the current transition.

Celebrity Boundless, Compass, Roamer, Seeker and Wanderer are separately marketed
future river products. None is included as operating. The
[company expansion table](https://www.rclinvestor.com/financial-info/key-statistics/)
starts Celebrity river deliveries in 2027.

## Verified content and gaps

- **84 new ships:** 83 ocean and Celebrity Flora as expedition.
- **374 verified fact fields**, **43 conflicting fields**, **1,179 unknown slots**.
- **257 named onboard venues** and **11 entertainment programs**; these are partial
  named lists, not total restaurants, shops or shows.
- **96 distinct primary source URLs**, with per-ship source IDs, check dates and
  field locators. No reseller facts are promoted.
- No fabricated IMO/ENI identifiers, canonical place links, photo permissions,
  reviews, passenger positions or cabin numbers. No photos or cabin categories are
  added in this batch.

| Verified field | Ships |
| --- | ---: |
| Official deck-plan link | 83 |
| Crew complement | 70 |
| Length | 53 |
| Explicit double-occupancy capacity | 50 |
| Entered-service year/date | 44 |
| Explicit passenger-deck count | 28 |
| Gross tonnage | 24 |
| Explicit construction year | 19 |

Utopia also has directly stated dining-outlet, bar and pool counts. Other venue totals
remain unknown. A missing specification does not become zero.

Construction years remain incomplete: an age heading, delivery announcement or
company **Year in Service** column is not silently relabeled **Year built**.
Norwegian’s explicit construction-year labels are retained separately from its
refurbishment labels. Unqualified **Occupancy**, **Passengers** and **Estimated
Capacity** do not establish maximum, lower-berth or double-occupancy capacity.
Regional **Gross Register Tonnage** is not silently converted to GT.

## Source conflicts retained

- Royal Caribbean’s age guide and corporate fleet table give differing tonnage
  values for 28 new ships. Their differing precision or reporting basis is unresolved;
  those fields remain marked conflicting. Approximate double occupancy is labeled
  as such. Anthem’s unqualified “Decks” value is not assumed to be passenger decks.
- Twelve Celebrity ship pages and the corporate table have differing tonnage values
  or labels. These are withheld pending reconciliation; construction dates are not
  derived from corporate service years.
- Norwegian Luna’s current US and UK pages state different double-occupancy figures
  (3,565 and 3,571). Neither becomes a preferred published capacity in this package.
- MSC Seascape’s operator prose states 339m while technical panels state 323m. Its
  UK and global panels also disagree on tonnage. Both fields remain conflicting.
- The current 2026 Icon-class **Legend of the Seas** is distinct from the older 1995
  namesake. No old registry ID, history or specifications are reused.

The real catalog display function hides every conflicting and unknown field. The
public read RPC retains sourced conflict records for audit; this distinction is
covered by the prepared publication checks.

## Access and verification limits

Royal Caribbean, Norwegian and Celebrity ship HTML was retrieved from public official
pages. MSC direct automated requests returned access errors; accessible indexed
official pages supplied the recorded facts. An unrelated regional redirect was
rejected in favor of the matching global ship page. No access controls were bypassed.
The sidecar records these access boundaries. Official images were not imported merely
because they appeared on a public page; some image captions refer to sister ships.

Fifteen offline checks cover the actual catalog contract/display functions, prior
identity preservation, full listed-fleet reconciliation, source linkage, unknowns,
conflicts, capacity basis, dates and mutation rejection. Separate private release
checks verify exact payloads and guarded transaction boundaries. They do **not**
replace the still-required live collision and rollback gates.

Release order: review exact frozen artifacts; run read-only identity collisions;
run the exact import/publication transaction with rollback; inspect the result and
confirm no persisted drafts; then separately review the matching commit transaction.
After publication, verify every public detail and exact-name search result. The
prepared visibility rollback hides only these immutable ship/Universe identities and
does not delete catalog or review history. Operational SQL is held outside this public
repository.

If all 84 are later published, the three reviewed batches would cover **155 ships
across 17 operators**. The existing 58-operator lead registry would still have 41
operators without a verified staged ship. That registry itself is a research starting
point, not a claim to contain every operating cruise operator worldwide. Further
construction-year, capacity, shop and entertainment verification remains necessary.
