# Verified operating fleet research — batch 005

Checked **2026-09-21**. This is staged research, not a publication record. The
existing 218 identities in batches 001–004 are pinned by hash and are not changed.

## Prepared coverage

| Cruise brand | New operating drafts | Scope |
| --- | ---: | --- |
| Viking | 97 | 84 river, 12 ocean, 1 expedition |
| AmaWaterways | 27 | River ships, including its public overnight safari product |
| **Total** | **124** | **111 river, 12 ocean, 1 expedition** |

The batch contains **454 verified facts**, **6 conflicting facts** and **525 named
physical venues**, supported by 144 distinct primary URLs. The other 1,896 fact
slots remain unknown. No show schedules, new cabin categories, photos, reviews,
registry identifiers or canonical onboard place IDs were invented. Viking Mira
has no staged venue list because its reviewed sources did not establish a named
ship-specific list; facilities were not copied from another vessel.

Viking Kara, Viking Octantis, AmaMagna, AmaDouro and AmaLea retain their earlier
identities. AmaVida's separate 2028 product page is one vessel, not a new ship.

## Evidence and limits

- Viking's `/ships/longships/` and `/ships/longships/index.html` return different
  fleet lists. Both were reconciled, as were the ocean URL variants and the
  regional Douro, Elbe, Seine, Nile, Asia and Mississippi pages.
- Viking's 2025 annual report explicitly labels **Maximum Passenger Capacity**
  on printed pages 39–40. These figures retain the reporting date, December 31,
  2025, and are corroborated against current individual guest figures. Its
  footnote identifies 182 berths when Longships are allocated to Asia Outbound;
  the staged figure is maximum vessel capacity, not an expected sailing load.
- The annual report's combined **Year Built / Refurbished** column is not a
  stand-alone construction-year source. Construction facts require the explicit
  individual **Year built** label. Different combined-year values cause the
  relevant new fact to be marked conflicting rather than silently chosen.
- Official PDFs were visually checked. Their GRT figures were not relabeled GT,
  deck labels were not counted as total/passenger decks, and maiden seasons were
  not converted into build years. Named restaurants and theatres are physical
  venues, not guaranteed dining openings or show schedules.
- AmaWaterways' official US sitemap exposes 37 distinct ship pages and one
  future-year duplicate. Sitemap presence alone is not operating evidence:
  individual overnight itineraries and dated launch announcements are also used.
  Its paginated fleet landing and corporate headline fleet counts do not establish
  a complete list of currently operating physical vessels.
- Viking Beyla's direct page timed out. Clearly identified official indexed
  ship-page observations, the Elbe fleet page and the annual table establish its
  facts; the direct fetch is not reported as successful.
- Cruise brand/operator IDs describe the marketed product. Legal ownership is
  not inferred, including chartered Viking river ships and Ama's safari vessel.

## Conflicts retained and withheld identities

Six new factual conflicts stay out of public fact display: AmaSofia and AmaSonata
passenger capacity; Viking Egdir, Embla and Gymir build-year discrepancies; and
Viking Ra's refurbishment year. AmaSofia's overview says 152 passengers, its FAQ
says up to 156, and its March 2026 press release says up to 154. No figure is chosen.

The inventory records **37 withheld or excluded identities**. This includes:

- Future ships such as Viking Sol, Fulla, Hnoss, Laga, Ran, Brahmaputra, Ganges,
  Anubis, Geb, Astrea, Leda, Lyra and Vega; Viking Libra's November 2026 delivery;
  Viking Sekhmet's November 2026 debut; and Ama's future Rudi, Fiora, Gaia, Cleo,
  Maria, Nubia and announced Clara.
- Viking Haki, Halogi, Rota and Sjofn: 2026 build/October naming statements do not
  independently confirm passenger service by the checked date. Viking Ptah's
  August delivery and September debut announcement do not establish an exact
  service-start date before September 21.
- AmaMaya: the ship page still says 2026, while the dated April 2026 expansion
  release says 2027. AmaMaria says both 2027 and 2028, both future. AmaNubia's page
  now says November despite an earlier September announcement.
- Viking Yi Dun / Yidun, formerly Viking Sun: its official report establishes a
  Viking accommodation agreement and CMV ownership/operation, while the individual
  consumer URL redirects to the fleet. Preserve the aliases as one unresolved
  operator-role case; no new duplicate is imported.
- Viking Njord and Prestige: the annual fleet record does not resolve current
  public service sufficiently for this batch. The six Russia/Ukraine ships are
  excluded because the annual report explicitly says those itineraries are not
  for sale.

### Existing-record discrepancy for separate review

The existing Viking Octantis row is **not modified**. Its ship page labels year
built 2022, whereas the annual report's combined built/refurbished column gives
2021. This warrants a separate construction/commissioning basis review, not an
automatic overwrite. The evidence sidecar records both primary URLs.

## Local validation

Run `batch-005-validate.cjs` from this directory with the project's TypeScript
dependency available. It validates the real catalog contract, all four previous
hashes, normalized identities, primary-source linkage, future/suspended exclusions,
typed capacities, unknowns, conflicting-fact visibility and distinct venue IDs.
`batch-005-validation.json` records the result. These checks make no network calls
and perform no database writes. Live collisions and transaction/public-read gates
must pass separately before publication.

## Remaining coverage

This batch is not a complete Viking fleet or a worldwide fleet completion claim.
Withheld identities need the specific follow-up described above; unsupported
specifications, onboard shops, entertainment programs and dates remain unknown.
The 58-operator lead registry is a research starting point, not a verified global
operator census. Adding these drafts would bring the prepared unique catalog to
342 ships across the same 21 operators; publication is a separate reviewed step.

Primary starting points: [Viking river fleet](https://www.vikingrivercruises.com/ships/index.html),
[Longships index](https://www.vikingrivercruises.com/ships/longships/index.html),
[Viking ocean fleet](https://www.vikingcruises.com/oceans/ships/index.html),
[Viking 2025 annual report](https://ir.viking.com/sec-filings/all-sec-filings/content/0001745201-26-000007/0001745201-26-000007.pdf),
[AmaWaterways ships](https://www.amawaterways.com/ships), and
[Ama's dated fleet expansion](https://www.amawaterways.com/news/press-releases/2026/ships-2032).
Per-ship sources and field observations are in the staged data and evidence sidecar.
