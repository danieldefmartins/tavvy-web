# Cruise fleet research — batch 002

Checked **2026-09-21 UTC**. This is a research inventory, **not an importable or publishable ship catalog**. It adds **69 distinct ship-name leads across 10 additional operators** from the existing 58-operator discovery registry. The registry is itself incomplete; neither this batch nor the two batches combined establish worldwide fleet coverage.

The leads have no canonical ship/Universe IDs, verified IMO/ENI, photos, specifications or publishable operating status. All `operating_status` values remain `unknown`. A ship appearing on an operator website proves that it is advertised there; it does not by itself prove present service, ownership or a unique physical identity.

## Coverage of the inspected sources

“Complete page” means every ship entry in the retrieved official fleet section was transcribed. It does not mean every ship fact or every current sailing was verified. Counts below are our distinct-name transcription counts; explicit operator fleet-total claims are separately recorded in JSON.

| Operator | New name leads | Coverage | Official evidence |
| --- | ---: | --- | --- |
| Cunard | 4 | Complete page; explicit four-ship total | [Fleet](https://www.cunard.com/en-us/cruise-ships) |
| Azamara | 4 | **Partial access**; official indexed text enumerates four, but direct page returns 403 | [About / Our Ships](https://www.azamara.com/about-azamara), [home fleet section](https://www.azamara.com/gb/home) |
| Virgin Voyages | 4 | Complete retrieved **full-fleet statement**, corroborated by current campaign; dedicated fleet page inaccessible | [Full-fleet release](https://www.virginvoyages.com/press/latest-releases/virgin-voyages-sisters-at-sea-fleet-meetup), [2026 campaign](https://www.virginvoyages.com/cruises/specialized-themed/eat-drink-food-festival) |
| Holland America Line | 11 | Complete page | [Fleet](https://www.hollandamerica.com/en/us/cruise-ships) |
| A-ROSA | 15 | Complete current fleet tables; explicit fifteen-ship total | [Official company/product press kit](https://newsroom.arosa-cruises.com/press-kits/press-kit-company-product.html) |
| Riverside Luxury Cruises | 3 | Complete page; explicit three-ship total | [Ships](https://riverside-cruises.com/en/ships) |
| Avalon Waterways | 19 | Complete **marketed ship list** across Europe, Asia, South America/Africa | [Fleet](https://www.avalonwaterways.com/River-Cruise-Ships/) |
| Aurora Expeditions | 3 | Complete page; explicit three-ship total | [Ships](https://www.aurora-expeditions.com/ship) |
| Swan Hellenic | 3 | Complete advertised page; individual service status requires checking | [Ships](https://www.swanhellenic.com/ship), [overnight accommodation](https://www.swanhellenic.com/experience/onboard-experience) |
| Coral Expeditions | 3 | **Partial access / historical plan**; official indexed 2025–27 schedule updated 2025-09-01; main site inaccessible and full PDF timed out | [All-vessel sailing schedule](https://media.coralexpeditions.com/media/All-Vessel-Sailing-Schedule-Coral-Expeditions.pdf) |

Seven fleet pages plus one full-fleet statement give complete enumerations of their inspected sections: **62 names**. Two operators have partial access: **7 names**. The research classifications are **23 ocean, 36 river and 10 expedition** candidates; they are not counts of verified operating ships.

## Identity and scope cautions

- **Avalon:** the 19 entries comprise 15 European ships, Avalon Saigon, Delfin III, MS Infinity and MS Farah. The latter three may also be marketed under another operator. Confirm the actual operator and permanent identity before assigning a Tavvy ship UUID. Do not treat the Galápagos MS Infinity as a river ship just because it appears on a river-cruise website; its expedition classification remains a research assessment.
- **Aurora:** the registry's Australian website redirects to `https://www.aurora-expeditions.com/au`. That establishes the official new domain used for fleet evidence. The shared registry was not changed.
- **Coral:** schedule dates are planned itineraries from a document updated in 2025. They establish useful overnight-cruise leads, not completed sailings or current operation in September 2026. No current fleet-completeness claim is made.
- **Azamara:** four names appear in both indexed official sections, but 403 access prevents marking full-page inspection complete.
- **Swan Hellenic:** SH Minerva is advertised on the retrieved fleet page, but its current service status needs a separate dated check. Operator pages use inconsistent fleet-wide capacity wording; this name-only batch imports no capacity claims.
- **Renames and shared names:** permanent identities remain unresolved for all leads. Keep brand prefixes, roman numerals and current operator context; do not merge Rotterdam, Infinity, A-ROSA VIVA or other names based only on a fuzzy match.
- **Exclusions:** shore-excursion tenders/Zodiacs, day-trip-only craft, private-charter-only vessels and names appearing solely in historical narratives were not added. Offering a whole-ship charter does not exclude a vessel also sold as public overnight cruises. Coral development/UAT hosts were not used as current official fleet evidence.

Exact normalized-name checks found **zero matches with batch001** and zero duplicate names within this batch. That is a name-level result, not proof of 69 unique physical vessels. No aliases or operator-history links were invented.

## Files and local validation

- `batch-002-fleet-inventory.json`: source URLs, access status, dates, per-operator coverage, names and unresolved identity fields.
- `batch-002-validate.cjs`: local research-boundary checks plus failure cases for false completion, invented identity/status, duplicate names, incorrect source relationships and the Galápagos classification.
- `batch-002-validation.json`: deterministic validation result and input hashes.

Run from the repository root:

```sh
node data/cruises/research/batch-002-validate.cjs
```

Add `--write` only to refresh this batch's validation report. The validator makes no network requests or database changes. All four batch001 files are hash-checked; the registry snapshot hash is recorded separately because other research may legitimately advance it.

## Next work before catalog inclusion

Resolve permanent ship identity and prior names/operator relationships; obtain dated current-service evidence; confirm public overnight eligibility per ship; then prepare sourced facts through the existing staged catalog contract. Retry Azamara/Coral through an accessible official source before upgrading their coverage. No production records, migrations, runtime files or registry entries were changed by this batch.
