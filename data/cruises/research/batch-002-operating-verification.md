# Cruise batch 002 — operating-ship verification

Checked **September 21, 2026**. This is a **59-ship draft**, continued from the
existing 69-name research inventory. It has not been imported or published by this
research task. Worldwide coverage remains incomplete.

## What this batch establishes

Current official operator sources identify 59 public overnight ships: **19 ocean,
34 river and 6 expedition ships**, across eight operators. The draft contains
127 sourced optional facts, 88 selected onboard venues, 24 selected cabin categories
and three named entertainment programs. **994 optional facts remain explicitly
unknown.** There are no photos, invented reviews or links to invented canonical
venue places. Selected facilities are not a complete onboard directory.

“Operating” means listed by the operator as a current fleet member offered for
public overnight cruises. It does not mean live vessel tracking, confirmed cabin
availability, or proof that every advertised sailing occurred. The check date is
the research date; an undated operator page is not represented as published that day.

The evidence sidecar records each ship's source URLs, field references, check date,
source access limitations, scope rationale and unknowns. Ship UUIDs are newly minted
catalog identities, not discovered IMO/ENI identifiers. They must remain stable after
renames. Optional IMO/ENI values remain null. Current name/operator/official ship URL
can establish a catalog identity, subject to reconciliation with existing records.

## Operator coverage

| Operator | Original leads | Draft ships | Withheld | Official evidence and limits |
| --- | ---: | ---: | ---: | --- |
| Cunard | 4 | 4 | 0 | [Current fleet](https://www.cunard.com/en-us/cruise-ships) and four individual ship pages with accommodation and 2026 voyage sections. |
| Holland America Line | 11 | 11 | 0 | [Current fleet](https://www.hollandamerica.com/en/us/cruise-ships), individual ship pages and [historical namesake/service-era archive](https://www.hollandamerica.com/150th-anniversary/en/category/ships/). |
| A-ROSA | 15 | 15 | 0 | [Current company fleet](https://newsroom.arosa-cruises.com/press-kits/press-kit-company-product.html), individual technical pages and regional overnight itineraries. STELLA's individual URL timed out; the full Rhône kit establishes current identity, service, length and maximum guests. LUNA's individual technical text was indexed; the full Rhône kit supplies independent scope and size evidence. |
| Avalon Waterways | 19 | 16 | 3 | [Current fleet](https://www.avalonwaterways.com/River-Cruise-Ships/) and individual pages. Only the 16 Avalon-branded ships are included; three other marketed vessels need operator reconciliation. |
| Virgin Voyages | 4 | 4 | 0 | Four individual ship pages plus the [August–September 2026 four-ship campaign](https://www.virginvoyages.com/cruises/specialized-themed/eat-drink-food-festival). Public multi-night cruises are distinct from day-visitor events. |
| Riverside Luxury Cruises | 3 | 3 | 0 | [Three-ship fleet](https://riverside-cruises.com/en/ships), individual all-suite ship pages and public river itineraries. Former-name history is not inferred from image filenames. |
| Aurora Expeditions | 3 | 3 | 0 | [Current three-ship fleet](https://www.aurora-expeditions.com/ship) and individual expedition/stateroom pages. Operator service limits are labeled as such. |
| Swan Hellenic | 3 | 3 | 0 | [Current fleet](https://www.swanhellenic.com/ship), individual ship pages and coherent [SH Minerva May 2026 itinerary](https://asia-pacific.swanhellenic.com/manila-hiroshima26). No claim that every scheduled voyage occurred. |
| Azamara | 4 | 0 | 4 | [Official ship pages](https://www.azamara.com/our-ships/azamara-journey) and current news were indexed, but direct retrieval returned HTTP403. Withheld from this draft pending stronger accessible evidence; this does not establish nonoperation. |
| Coral Expeditions | 3 | 0 | 3 | [Current site](https://www.coralexpeditions.com) returned HTTP403. The previously indexed operator schedule was updated September 1, 2025; it remains planning evidence, not a fresh status check. |

The draft accounts for every name in the original inventory. It does not claim
complete current fleet verification for all ten operators, full legal hull ownership,
or complete venue/specification coverage for any operator.

## Important boundaries and conflicts

- A-ROSA ALVA: **built 2018, entered service 2019**. Construction and service are separate.
- A-ROSA ALEA/CLEA: current completed refurbishment is described as **early 2026**.
  Their 2009 construction predates joining A-ROSA in 2024; earlier names remain unresolved.
- Cunard “guests” and “bars and lounges” are not relabeled as maximum capacity or bars.
  Future Queen Victoria and Queen Mary 2 refit features are excluded.
- Holland America service-era dates are not construction dates. Future “Evolution”
  features and deck plans are excluded. Archive length conversions retain their source basis.
- Avalon sister-ship virtual tours are not evidence of the target ship's precise
  layout or photos. Deck totals are not inferred from four visible deck labels.
- Brilliant Lady's current page has a deck-plan heading naming Resilient Lady.
  That plan is withheld. Entertainment entries are programs, not physical venues or
  guaranteed performance schedules. Valiant's Ariya opening date was not established,
  so it is omitted as a current venue.
- Aurora passenger figures describe operator service limits. Douglas Mawson carries
  up to 154 on Small Ship Cruises and 130 on Expeditions; the distinction is preserved.
- Swan's generic fleet page says no more than 152 guests, while Diana's own page says
  192. Neither unqualified number is promoted to a typed capacity. “Staff” is not
  assumed to mean crew only. Copied, inconsistent route descriptions on other Minerva
  campaign subdomains are excluded from evidence.
- No photo reuse license, IMO, ENI or full historical ownership record was established.
  Missing values are null rather than a guessed value or an invented asset.

## Ten withheld names

- **Azamara:** Journey, Quest, Pursuit, Onward.
- **Coral Expeditions:** Coral Adventurer, Coral Geographer, Coral Discoverer.
- **Marketed by Avalon:** Delfin III, MS Infinity, MS Farah. The actual operator and
  alias relationship must be resolved before assigning a Tavvy catalog record.
  MS Infinity remains an expedition candidate, not a river ship because of the website.

## Remaining work

The registry still contains **58 operator leads**, not a worldwide fleet total.
Batch 001 represents nine operators and this draft adds eight. **41 registry operators
have no verified staged ship in either batch**, including Azamara and Coral above.
Their names and official lead URLs remain listed in the evidence sidecar under
`remaining_registry_operators`; they are not relabeled as verified operating fleets.
Operators represented by batch 001 still need full-fleet research beyond its 12 ships.

Before publication, reconcile this draft against the current canonical ship catalog,
historical names, official URLs and Universes. A collision must stop an import for
manual review; do not create a second ship or replace existing content by name.
The import/publication gate and reversible visibility rollback are maintainer review
artifacts. They have only been prepared locally; no live collision or rollback result
is claimed here.

## Local validation

`batch-002-verified-validate.cjs` passes 12 focused checks covering the publication
contract, original-lead reconciliation, unique identities, provenance dates/source
resolution, preserved unknowns, official domains and rejection cases. It also verifies
that the frozen batch 001 files and operator registry remain unchanged. The original
69-lead inventory and its research-only semantics remain intact.

Passing a schema test does not independently prove a source claim. The evidence
sidecar supplies the human-reviewed observations and their limitations.
