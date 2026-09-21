# Cruise catalog batch 006

Checked **September 21, 2026**. This is verified research staged for review, not a publication receipt or a claim of worldwide completion.

## Scope

| Operator | New operating ships | Reconciliation |
| --- | ---: | --- |
| Seabourn | 5 | All five current fleet entries; sold Sojourn kept separate |
| Silversea Cruises | 12 | Eight ocean and four expedition ships |
| Oceania Cruises | 7 | Sonata is future; Aurelia is a future Nautica rename; Regatta transition withheld |
| Regent Seven Seas Cruises | 6 | Prestige is future |
| Azamara | 4 | All four current ships, with sourced permanent IMO identifiers |
| Holland America Line | 0 | All 11 current ships already have identities in the earlier batches |

**34 new ships: 28 ocean and 6 expedition.** The five earlier files are hash-pinned in the evidence sidecar and contain 342 identities. These are not rewritten or duplicated. This batch would raise the combined catalog to 376 ships if reviewed and published.

“Operating” here means a member of the operator's current public overnight cruise fleet, supported by a matching individual ship product and accommodations. It is not a live position, daily availability, or assurance that a particular departure is on sale. Private charter-only and day-trip vessels are excluded.

## Facts and onboard places

- **155 verified facts**, four conflicting facts retained for audit but hidden by the existing renderer, and 487 unknown fact slots.
- **368 named physical venues** from ship-specific operator sections. These include dining, bars, shops and entertainment spaces where named. This is a partial venue inventory; its length is never used to manufacture a restaurant/shop count.
- **Four verified IMO numbers and nine sourced historical names.** No ENI, photographs, canonical place links, guest reviews, cabin taxonomy, show schedule or performance title is invented.
- 70 unique primary source URLs. Each ship, fact, venue and history entry has source references; the sidecar records the relevant section or PDF page and how it was accessed.

## Important distinctions

### Identity and future changes

The issuer's [Azamara admission document](https://live.euronext.com/sites/default/files/contributions_live/2025-08/1754551563_32502_2025%2008%2006%20-%20SP%20Cruises%20Intermediate%20Limited%20-%20Admission%20Document%20%28executed%20version%29.pdf), printed page 4, supplies the following identifiers:

| Ship | IMO | Verified former names, partial history |
| --- | --- | --- |
| Azamara Journey | 9200940 | R Six, Blue Star, Blue Dream |
| Azamara Onward | 9187887 | R Three, Pacific Princess |
| Azamara Pursuit | 9210220 | R Eight |
| Azamara Quest | 9210218 | R Seven, Delphin Renaissance, Blue Moon |

All four IMO check digits validate. Transfer dates and historical operator ownership are not inferred. The importer must compare both identifiers and historical names before assigning the staged IDs; Pacific Princess is not assumed to be every vessel that ever used that name.

[Oceania Aurelia](https://experience.oceaniacruises.com/introducing-oceania-aurelia-the-ultimate-explorer) is the announced November 2027 reimagining of Nautica. It is a collision alias, not a separate operating vessel or an already-effective historical name. Sonata and Seven Seas Prestige remain outside this operating batch. Seabourn Sojourn and Oceania Regatta have transition questions documented in the inventory rather than assigned an unverified current operator.

The current [Azamara Quest page](https://www.azamara.com/our-ships/azamara-quest) includes additions scheduled for December 18, 2026. The future Penthouse Deck, Grandview and Panorama additions are not imported as current facilities or cabin categories.

### Construction, dimensions and decks

Construction uses explicit built-year labels or issuer fleet tables. Silver Dawn and Silver Endeavour were built in 2021 but entered the listed service in 2022; those values remain separate. Seabourn Pursuit, Venture and Quest have no construction year in this bounded evidence set; launch dates are not substituted. Encore and Ovation use the operator's explicit historical BUILT labels.

Lengths retain operator metric values or documented feet-to-metres conversions. Silversea's PDFs explicitly state passenger decks; Azamara explicitly states guest decks. Regent's generic “Decks” label is left untyped. Numbered deck diagrams never establish total decks. Generic Tonnage, GRT and Azamara's Net Tonnage are not relabeled as GT.

### Passenger capacity

The [Oceania capacity FAQ](https://oceaniacruises.zendesk.com/hc/en-us/articles/360006718234-What-is-the-capacity-of-each-ship), updated April 2, 2025, explicitly identifies double occupancy for the 1,250 and 670 groups; Allura/Vista use an up-to 1,200 guest statement. Those bases and the source date are retained. Cabin counts are not multiplied into passenger capacity.

Azamara's August 2025 issuer document and [©2026 deck-plan tables](https://www.azamara.com/fr/static-assets/resources/b2b-pdfs/brand-info/All_deck_plans.pdf) differ:

| Ship | Issuer double occupancy | ©2026 deck-plan label | Treatment |
| --- | ---: | --- | --- |
| Journey | 694 | 702 double occupancy | Conflicting; hidden |
| Pursuit | 694 | 702 double occupancy | Conflicting; hidden |
| Quest | 686 | 702 double occupancy | Conflicting; hidden |
| Onward | 688 | 684 occupancy, unspecified basis | Conflicting; hidden |

Whether configuration or reporting dates explain these differences is unresolved. Generic guest counts for Seabourn, Silversea and Regent stay observations without an invented maximum/double-occupancy basis. Silver Cloud's polar deployment figure is not promoted to a global maximum.

### Physical venues and experiences

The Marquee is recorded once for Silver Nova/Ray; its Grill and Spaccanapoli services are not counted again as separate physical venues. Regent's La Veranda and evening Sette Mari share one entry. Seabourn's Earth & Ocean service at The Patio is not an extra room. In-suite dining, chef-table experiences and generic shopping descriptions are not fabricated physical businesses or scheduled shows.

## Validation and remaining work

`batch-006-validate.cjs` runs 21 offline checks against the actual catalog/publication and display helpers, including mutation rejection, all 342 previous identities, IMO checksums, source linkage, unknowns, conflicting capacity, and future aliases. It writes the corresponding validation report when invoked with `--write`.

Publication requires a separate reviewed collision query and rollback-only import/publication gate. The prepared gate checks exact sourced IMO/ENI values instead of requiring them to be null, guards current/historical/announced names, and verifies public projection with anonymous access. No database query or import is performed by the source validator.

Worldwide coverage remains incomplete. Venue inventories and several specifications remain partial even for these 34 ships. The six reviewed operator lists are reconciled as of the checked date; they do not establish completeness for the remaining operator registry or every ship globally.
