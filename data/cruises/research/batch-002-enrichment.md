# Cruise batch 002: specification and onboard enrichment

Checked September 21, 2026. **Prepared data, not a publication receipt.** This
adds evidence to the same 59 operating overnight ship drafts; it does not extend
the fleet inventory or claim worldwide completeness. The original batch remains
unchanged. Its staged JSON SHA-256 is
`cb052ee196c0987169efec31118cf8ebf0fdb80670eb2f99e971e45469083526`.

## What improved

| Catalog content | Original | Enriched |
| --- | ---: | ---: |
| Ships / operators | 59 / 8 | 59 / 8 |
| Verified specification fields | 127 | 191 |
| Conflicting fields, hidden from display | 0 | 3 |
| Unknown optional fields | 994 | 927 |
| Named onboard venues | 88 | 318 |
| Entertainment programs | 3 | 34 |
| Cabin categories | 24 | 24 |
| Reuse-approved photos | 0 | 0 |

The net gain of 64 verified fields comprises 65 previously unknown fields becoming
verified and one prior length measurement becoming conflicting. Greg Mortimer's
existing maximum-guest field was also corrected to distinguish its overall advertised
limit from its lower expedition limit. No published batch 001 facts are changed.

| Verified specification | Original | Enriched |
| --- | ---: | ---: |
| Construction year | 14 | 31 |
| Entry into service | 19 | 21 |
| Length | 33 | 48 |
| Gross tonnage | 0 | 4 |
| Guests at double occupancy | 0 | 2 |
| Maximum guest capacity | 16 | 17 |
| Crew | 4 | 7 |
| Total decks | 5 | 22 |
| Passenger decks | 0 | 3 |

Counts of restaurants, shops, pools and other amenities are **not** calculated from
the partial lists of named venues. A theatre is a venue; a band or show is a program.
Entertainment listings describe an operator offering, not a guaranteed sailing schedule.

## Primary evidence

The sidecar records 40 distinct enrichment source URLs, checked dates, document
locators, access limitations and every changed field's before/after value. Existing
status sources, ship/Universe IDs, all earlier sources and child IDs remain intact.

- **Avalon:** [Den Breejen's ship references](https://www.breejen-shipyard.nl/en/shipbuilding/passengers-vessels/3556-avalon-envision/)
  explicitly label construction year and overall length for nine named vessels.
  Envision's builder year is 2018 and View's is 2019; later public voyages are separate
  events. Passion's source was available as an indexed official extract, with that
  access limitation recorded. [West Sea's Alegria record](https://west-sea.pt/en/avalon-alegria/)
  confirms its 80-metre length. Its unqualified project year is not promoted to a
  construction date. Individual Avalon pages confirm named amenities;
  [Saigon's page](https://www.avalonwaterways.com/river-cruises/avalon-saigon/)
  explicitly gives a maximum of 36 guests.
- **A-ROSA:** the [2024 fleet specification table](https://www.arosa-cruises.com/fileadmin/media/12_be_user_uploads/international_sales/agent_library_list_2/FleetOverview_2024.pdf)
  was checked against its page image, including ship-group columns. It explicitly
  uses 3.5 decks for four ships; no rounding to four was invented. The document year
  remains visible in the fact note. The [current SENA press kit](https://newsroom.arosa-cruises.com/press-kits/press-kit-a-rosa-sena.html)
  confirms five decks. The operator FAQ independently supports an onboard shop
  across the fleet. Historical deployment forecasts are not imported.
- **Aurora:** the [operator's voyage essentials](https://www.aurora-expeditions.com/getContentAsset/9306be7c-d6c1-4d18-8c3c-ff43cf58ab4c/8e265d97-ee24-47b6-a823-0d8b4ca7c908/251219-Polar-Voyage-Essentials-2.pdf)
  provides detailed specifications and named facilities. The current technical strip
  and Ulstein's named-ship references provide separate construction and capacity
  evidence. Crew ranges remain ranges in research; the PDF's explicitly labeled
  gross registered tonnage is not silently retyped as GT.
- **Swan Hellenic:** IAATO's own member vessel directory gives explicit construction
  years for [Vega](https://iaato.org/node/63407), [Minerva](https://iaato.org/node/74564)
  and [Diana](https://iaato.org/node/63405). Its passenger/crew capacity fields are not
  assumed to be current maximum passengers or the actual crew complement.
- **Riverside:** the [operator's brochure page](https://riverside-cruises.com/en/brochures)
  directly links its [hosted image brochure](https://publish.flyeralarm.digital/riverside-luxury-image-brochure/).
  Pages 106 and 114 were checked as text and matching page images. They explicitly
  give construction years, metric lengths, crew complements and named dining/bar
  spaces. Mozart's historical 2016 renovation is not assumed to be its latest refit.
- **Holland America:** the [November 2025 fleet matrix](https://www.hollandamerica.com/content/dam/hal/inventory-assets/ships/at-a-glance/hal-ships-at-a-glance.pdf)
  was visually checked by ship column, including permanent-restaurant versus
  menu-only symbols. It supports named dining/retail spaces and ship-specific bands.
  The [2026–2027 planner](https://www.hollandamerica.com/content/dam/hal/marketing-assets/PDFs/2026-2027-hal-legendary-voyages-planner.pdf)
  gives 1,432 guests for Volendam and Zaandam; the [current capacity FAQ](https://www.hollandamerica.com/en/us/faq/onboard-cruise-experience/onboard-information/cruise-ship-guest-capacity)
  identifies the operator's double-occupancy basis. Class ranges are not assigned to
  individual ships. A separately discovered fleet-facts PDF is effective November
  2020, so its old maximum-passenger and crew figures were withheld.
- **Cunard:** the operator's named-ship articles distinguish total decks from guest
  decks and first voyages from construction. Named dining and entertainment spaces
  come from each ship's own article; Queen Anne's passenger decks come from the
  captain's construction log.
- **Virgin:** the [January 2026 operator size article](https://www.virginvoyages.com/ahoy/stories/how-big-are-cruise-ships)
  explicitly covers all four Lady ships. Approximately 110,000 GT remains labeled
  approximate in the visible fact note. Its rough passenger estimate and crew lower
  bound remain research observations, not exact maximum/crew fields.

## Conflicts and remaining limits

1. **Greg Mortimer year built:** voyage PDF says 2018; current operator technical
   strip and designer record say 2019. Earlier construction activity differs from
   delivery. The field is withheld pending reconciliation.
2. **Sylvia Earle year built:** voyage PDF says 2021; current technical strip and
   designer record say 2022. The field is withheld pending reconciliation.
3. **Koningsdam length:** operator material gives 975 feet (297.2 metres rounded),
   whereas the [builder gives 299.65 metres overall](https://www.fincantieri.com/en/business/products/cruise-ships/Koningsdam).
   The measurement difference remains unresolved; the public display omits this field.

Many river and expedition operators publish a simple guest number without declaring
double occupancy, lower berths or maximum. These observations are retained, but
relabeling them to fit a different field would mislead comparisons. A future separately
labeled operator-stated capacity could represent them without guessing the basis;
this batch makes no schema or interface change.

This remains a selective onboard catalog. Full restaurant/shop inventories, named
shows on every ship, missing technical facts, verified permanent registry IDs,
dated operator/name history and media-reuse permission need further work. No
customer reviews or canonical place IDs were generated. The original ten withheld
leads and the 41 registry operators without staged ships remain outside this batch.

## Local verification

Run `node data/cruises/research/batch-002-enrichment-validate.cjs` with the project
dependencies available. The checks pin the frozen inputs, preserve identities and
existing child content, replay every change, reject missing/third-party provenance
and verify the actual display helper hides conflicts. Capacity bases, half decks,
construction dates and ship-specific entertainment are tested explicitly.

The catalog is still staged. Private collision, transactional import/publication and
visibility-rollback artifacts belong to the reviewed release process. Passing offline
checks is not proof of a production import or complete worldwide coverage.
