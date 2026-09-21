# Cruise batch 004 — verified operating fleet research

Checked **September 21, 2026**. This is a prepared catalog batch, not evidence of a database import or publication. Worldwide coverage remains incomplete.

## Fleet reconciliation

| Operator | Named fleet entries reviewed | New operating drafts | Excluded future ships |
| --- | ---: | ---: | --- |
| Carnival Cruise Line | 31 | 29 | Carnival Festivale (2027), Carnival Tropicale (2028) |
| Princess Cruises | 17 | 17 | None in this current list |
| Costa Cruises | 9 | 9 | Beachcomber is a future identity of Costa Fortuna, not an additional ship |
| Disney Cruise Line | 9 | 8 | Disney Believe (2027) |
| **Total** | **66** | **63** | **3 named future ships** |

All named entries on these four reviewed lists are reconciled. This does not establish every sailing's availability, real-time ship position, temporary dry-dock status or the completeness of the global fleet. Sources: [Carnival fleet](https://www.carnival.com/cruise-ships), [Princess fleet](https://www.princess.com/ships-and-experience/ships), [Costa fleet](https://www.costacruises.com/fleet.html), [Disney fleet](https://disneycruise.disney.go.com/en-au/ships/).

The batch excludes the **155 identities** pinned in batches 001, 002 enriched and 003. Including those prior staged or published batches gives **218 distinct prepared ship identities** across **21 operators**. These are research coverage counts, not assertions that 218 ships are live or that all fleets of those 21 operators are complete. Of the existing 58 operator leads, 37 still have no verified ship in these batches; the lead registry itself is not a claim of exhaustive worldwide operators.

## Evidence and scope

- **245 verified facts**, **14 conflicting facts withheld from display**, and **938 unknown fact slots**.
- **565 named physical venues** and **24 programs/shows**, each tied to its own ship and a primary source. Lists are partial. Programs carry a warning that availability and times vary by sailing.
- **100 distinct primary-source URLs**. Per-ship source IDs, dates, observation locators and values are in the evidence sidecar.
- Capacity is explicitly typed: 25 double-occupancy records, 17 lower-berth records and six maximum-capacity records. One ship can have both a double-occupancy and maximum figure; these are different measures.
- There are 47 verified lengths, 27 verified gross-tonnage values, 59 crew complements and 46 service dates/years. Service dates are never presented as construction dates.
- No IMO/ENI, construction year, refurbishment date, deck count, photograph, cabin inventory, canonical venue place ID or customer review is fabricated. Those fields stay unknown when not established by the reviewed sources.

Construction years and typed deck counts remain unknown in this batch. Operator pages often report service/relaunch/delivery dates or unqualified deck counts. Further official registry or technical-document work is needed for those fields. Photos require a separate reuse-permission review.

## Material decisions

### Carnival

Press sheets explicitly distinguish double occupancy, gross tonnage, crew and service year. Several apparent ship fact-sheet URLs redirect to Mardi Gras; those redirects are rejected rather than importing another vessel's figures. The individual consumer pages provide independently checked lengths and named dining/activity cards. For example, [Carnival Elation's press sheet](https://www.carnival-news.com/ship/carnival-elation-fact-sheet) supplies typed capacity.

Six consumer/press differences and the Jubilee builder/press difference are retained as conflicts. This includes a likely missing zero in the Liberty press-sheet tonnage; the catalog does not silently correct the source. The entered-service figures for Sunshine, Radiance and Luminosa can denote the renamed Carnival product, so they are not promoted as the hull's original first-service year.

### Princess

The [official fleet overview](https://www.princess.com/en-int/news/backgrounders-and-fact-sheets/princess-cruises-fleet-overview) labels capacity as **lower berths**. Consumer-page guest figures have no equivalent stated basis and are not substituted. Its unqualified Tonnage column is not silently relabeled GT or GRT. Current Star Princess and Sun Princess are the 2025 and 2024 new ships, not their older namesakes; no earlier ship's IMO or dimensions are reused.

### Costa and the Fortuna transition

Costa's public ship-page component data contains the named ship-specific facilities and FAQ facts. Combined restaurant/snack-bar counts are dining outlets, not restaurants alone; pools-and-hot-tubs counters are not swimming-pool counts. The separately stated pool totals are preserved. Bars-and-lounges and unqualified floor/deck counts remain research observations.

Costa Fortuna remains a current Costa fleet/product entry. The buyer's [acquisition announcement](https://www.margaritavilleatsea.com/margaritaville-at-sea-acquires-third-vessel-in-three-years-to-further-expand-fleet) says Costa operation continues into late 2026, while its [subsequent launch announcement](https://www.margaritavilleatsea.com/margaritaville-at-sea-reveals-all-new-original-production-shows-for-flagship-beachcomber) places Beachcomber's debut in January 2027. The precise handover date is not established. Keep **one immutable ship identity** through this transition; do not create a second operating Beachcomber. Recheck the transition before a delayed import or late-2026 use.

### Disney

The current corporate hub links the accessible [Q4/25 fact-sheet revision](https://disneyexperiences.com/app/uploads/2025/03/FY25-Q4-DCL-Disney-Connect-Fact-Sheet-1.pdf). Its ship table was visually inspected. The earlier URLs returning 404 are logged as rejected sources. Current operating status comes from the current fleet/ship pages, not this older document's seven-ship fleet count.

The [2026 builder reference](https://www.meyerwerft.de/de/inhalt/05_presse/05_02_publikationen/mw_referenzen_2026.pdf) explicitly labels maximum passenger capacity. Disney's unqualified Capacity column is not automatically treated as maximum. Operator/builder length and tonnage differences remain hidden conflicts. Adventure's [actual maiden voyage](https://disneyparksblog.com/dcl/disney-cruise-line-adventure-updates/) was March 10, 2026; December 2025 handover is a different event. The [Panama Canal's transit report](https://pancanal.com/wp-content/uploads/2026/02/ADV-03-2026-Monthly-Canal-Operations-Summary-January-2026.pdf) corroborates rounded length but conflicts with the builder's tonnage; its approximate passenger figure has no occupancy basis and is not promoted as maximum.

## Local validation

Run `node data/cruises/research/batch-004-validate.cjs` with the project's TypeScript dependency installed. The validator uses the actual catalog contract and display helpers. It tests prior hash pins, identity collisions, future-vessel exclusion, source linkage, exact fact evidence, typed capacities, hidden conflicts, partial venue counts and the Fortuna/Beachcomber boundary. It makes no network requests and performs no database writes.

The validation JSON records the exact input hashes. Separate maintainer-held SQL review artifacts provide collision preflight, a rollback-only import/publication gate, an equivalent guarded apply, public verification and a visibility-only rollback. None of those database operations was executed as part of this research task. Publication requires the maintainer's current collision and transaction checks.
