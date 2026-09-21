# Cruise batch 001 — local research verification

Checked 2026-09-21 UTC. **Draft; not imported or published. Worldwide coverage is incomplete.**

## Coverage

The existing discovery registry contains **58 operator leads**. This batch verifies current public overnight operation for **12 ships across nine operators**: four ocean, four river and four expedition ships. It does not certify any operator’s entire fleet. The registry remains unchanged because its lead-level coverage fields must not silently become a fleet-completeness claim.

Selected details: **51 verified facts, 48 physical venues, 36 cabin categories and two programs**. There are **175 explicit unknown facts and two conflicts** across the 19 specification keys per ship. These are not zeroes. All photos, IMO/ENI identifiers and unestablished name histories remain unknown.

| Ship | Segment | Verified facts | Venues | Cabins | Programs |
| --- | --- | ---: | ---: | ---: | ---: |
| [Icon of the Seas](https://www.royalcaribbean.com/cruise-ships/icon-of-the-seas) | ocean | 7 | 2 | 3 | 0 |
| [Celebrity Edge](https://www.celebritycruises.com/cruise-ships/celebrity-edge) | ocean | 2 | 4 | 2 | 0 |
| [Norwegian Prima](https://www.ncl.com/uk/en/cruise-ship/prima) | ocean | 5 | 5 | 3 | 1 |
| [MSC World Europa](https://www.msccruises.com/int/our-cruises/ships/msc-world-europa) | ocean | 5 | 4 | 3 | 0 |
| [AmaMagna](https://www.amawaterways.com/uk/ships/amamagna) | river | 5 | 6 | 3 | 0 |
| [AmaDouro](https://www.amawaterways.com/ships/amadouro) | river | 4 | 2 | 3 | 0 |
| [AmaLea](https://www.amawaterways.com/ships/amalea) | river | 4 | 3 | 3 | 0 |
| [Viking Kara](https://www.vikingrivercruises.com/ships/longships/viking-kara.html) | river | 4 | 4 | 4 | 0 |
| [MS Roald Amundsen](https://www.travelhx.com/en-us/ships/roald-amundsen/) | expedition | 5 | 5 | 3 | 1 |
| [Viking Octantis](https://www.vikingcruises.com/expeditions/ships/viking-octantis.html) | expedition | 4 | 4 | 3 | 0 |
| [Ultramarine](https://www.quarkexpeditions.com/uk/expedition-ships/ultramarine) | expedition | 2 | 4 | 3 | 0 |
| [Le Commandant Charcot](https://en.ponant.com/cruise-ships/le-commandant-charcot) | expedition | 4 | 5 | 3 | 0 |

## Evidence and limitations

- [Staged catalog](../staged/verified-operating-batch-001.json) follows the current import contract. Every established fact/venue/cabin/program references dated primary operator sources. [Evidence sidecar](batch-001-evidence.json) adds source sections, field paths, scope justification and omissions.
- `as_of` and `checked_at` identify the review date, not an invented publication or last-refurbishment date. Current operating status is based on the operator fleet and public overnight offers, not AIS tracking or guaranteed cabin availability. Multi-day packages may include hotels and flights; package days are not relabeled as ship nights.
- Stable ship and Universe UUIDs are distinct, minted once, and must survive later renames and operator changes. No live canonical catalog was queried by this research task. Before any import, reconcile against existing live UUIDs and official IMO/ENI records; do not merge solely on name or regenerate IDs from a changed URL.
- Venue and cabin arrays are selected verified subsets, not complete inventories. Counts are included only when explicitly stated; listed deck numbers, venues and staterooms never generate totals. No home-port coordinates or invented canonical venue place IDs are assigned.
- Generic passenger counts often lack an occupancy basis. They remain in the evidence sidecar; typed standard/maximum capacity fields stay null. Crew-only fields do not borrow counts that combine expedition staff and crew.
- No image reuse permission has been established. Official webpage photos, some of which depict sister ships or renderings, are deliberately not imported. No fabricated review taps, schedules or show guarantees are included.
- Programs are separate from physical venues: Prima’s currently listed Broadway Cabaret and HX’s itinerary-specific Onboard Science Program carry dates and variability notes. Historical Prima musical listings were not promoted to current programs.

## Conflicts and follow-up

1. **Icon of the Seas tonnage:** two current Royal Caribbean pages give 250800 and 248663. The field remains `conflicting`, hidden by the display contract. Other capacity/deck bases remain separately sourced.
2. **Norwegian Prima standard capacity:** the current ship page lists 3195 double occupancy; the official 03/23 flyer lists 3099. Preserve both sources and reconcile before showing this fact.
3. **AmaDouro stateroom total:** the detailed page says 51, while its current fleet page says 52. The contract has no stateroom-count key; neither total is imported.
4. **Avalon Envision deferred:** the official fleet lead exists, but its detailed page was inaccessible during this pass. AmaLea replaces it in this batch. This does not remove Avalon from operator discovery.
5. Continue official identity/rename history, typed capacities, construction dates, full venue/shop/deck inventories and current sailing-specific performances. Expand operators and regions after this batch is reviewed; do not describe these 12 ships as the world fleet.

## Checks performed

- Existing catalog validator: PASS, zero errors. Expected warnings represent explicit unknown/conflicting facts hidden from display.
- Batch-specific validation: **22 checks PASS** for identity uniqueness, provenance, source domains/dates, typed fields, capacities, program targets, draft visibility and honest coverage.
- Existing cruise catalog regression suite: **8 tests PASS**.
- [Validation report](batch-001-validation.json) records the dataset SHA-256 and exact counts. Checks validate structure and review decisions, not independent maritime truth.

Reproduce the contract and existing regressions from the web repository:

```sh
node scripts/cruises/validate-catalog.cjs data/cruises/staged/verified-operating-batch-001.json
node --test scripts/tests/cruise-catalog.test.cjs
```

## Release status

Only four new cruise data/research files belong to this handoff. No application, migration, existing operator registry, credentials, production database or deployment was changed. The parent integration review must reconcile canonical identities and decide publication separately. This batch does not establish that the Cruise Universe UI or backend is deployed.
