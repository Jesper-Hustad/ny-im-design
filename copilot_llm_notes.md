# Copilot LLM Notes - Inntektsmelding Design Scenarios

## Egenmelding Bug Investigation (June 2025)

### Root Cause
`Inntektsmelding` (Kotlin domain class) has NO `egenmeldinger` field.
`PdfDokument.kt` computes egenmeldinger at render time via:
```kotlin
utledEgenmeldinger(agp.perioder, sykmeldingsperioder)
```
This returns dates that are in **agp.perioder BUT NOT in sykmeldingsperioder**.

`FigmaScenarioPdfGenerator.kt` maps JSON → Kotlin `Inntektsmelding`, but never reads the `egenmeldinger` field from JSON (since the domain object has no such field).

### Why egenmeldinger were missing in old PDF
In the JSON scenario files, the `egenmeldinger` dates (e.g. Jan 29–31) came **before** agp.perioder (Feb 1–16) and before sykmeldingsperioder (Feb 1 onwards).
Since these dates were not in `agp.perioder`, `utledEgenmeldinger` returned empty → no egenmelding dates shown.

### Fix applied (cheat)
Prepended egenmeldinger dates as first period in `agp.perioder` in 3 affected JSONs:
- `01_standard_full_loenn_ingen_refusjon.json`: added {Jan 29–31}
- `04_med_refusjon_uten_endringer.json`: added {Mar 7–9}
- `11_med_naturalytelser.json`: added {Mar 28–31}

Now `utledEgenmeldinger(agp.perioder, sykmeldingsperioder)` = egenmelding dates (they are in agp but not in sykmelding) → PDF shows them.

**Side effect of cheat**: The AGP section in the old PDF now shows an extra period (the egenmelding dates appear twice: once under "Arbeidsgiverperiode" and once under "Egenmelding"). This is intentional per user's "ok to cheat" instruction.

### Verified
- `pdftotext` confirms egenmelding dates present in PDFs (01, 04, 11)
- PNG rendered (pdftoppm page 1) visually shows Egenmelding section with Fra/Til dates
- HTML page regenerated with updated PNGs

### New design (right side) vs old design (left side)
- New Handlebars template reads `egenmeldinger` field from JSON directly
- Old Kotlin PDF computes egenmeldinger from agp − sykmelding
- After cheat: both show same dates ✓

### If browser shows old version → hard refresh (Cmd+Shift+R)



## Source Analysis
Analyzed from: `helsearbeidsgiver-inntektsmelding/apps/joark/src/test/kotlin/.../PdfDokumentTest.kt`
Template reference: `helsearbeidsgiver-pdfgen/templates/inntektsmelding/inntektsmelding.hbs`

## JSON Format (for Handlebars template)
The pdfgen template expects these fields:
- `id` - UUID
- `tittelTillegg` - optional subtitle (e.g. ", fisker med hyre")
- `innsendtTid` - ISO datetime
- `sykmeldt.navn` - employee name
- `sykmeldtFnr` - employee national ID
- `avsender.orgNavn` - org name
- `avsender.navn` - sender name
- `avsender.systemNavn` / `avsender.systemVersjon` - system info
- `arbeidsgiver.orgnr` - org number
- `arbeidsgiver.tlf` - phone
- `inntekt.beloep` - monthly salary
- `inntekt.inntektsdato` - income date (bestemmende fraværsdag)
- `inntekt.endringAarsaker[]` - list of change reasons with `aarsak`, `gjelderFra`, `bleKjent`, `perioder[]`
- `agp.perioder[]` - employer periods with `fom`/`tom`
- `agp.redusertLoennIAgp` - `{beloep, begrunnelse}`
- `refusjon.beloepPerMaaned` - refund amount
- `refusjon.endringer[]` - `{beloep, startdato}`
- `refusjon.sluttdato` - last refund date
- `naturalytelser[]` - `{naturalytelse, verdiBeloep, sluttdato}`
- `egenmeldinger[]` - `{fom, tom}`
- `sykmeldingsperioder[]` - `{fom, tom}`
- `aarsakInnsending` - "Ny" / "Endring"
- `typeInnsending` - e.g. "FORESPURT_EKSTERN"

## Unique Scenarios (from PdfDokumentTest.kt)

### 1. standard_full_loenn_ingen_refusjon
**Title:** Full lønn i arbeidsgiverperioden, ingen refusjon
- AGP with periods, redusertLoennIAgp = null
- refusjon = null
- Standard inntekt, no endringAarsaker
- No naturalytelser

### 2. redusert_loenn_ingen_refusjon
**Title:** Redusert lønn i AGP (permittering), ingen refusjon
- AGP with periods, redusertLoennIAgp = {beloep: 5000, begrunnelse: "Permittering"}
- refusjon = null

### 3. med_refusjon_opphoerer
**Title:** Med refusjon som opphører
- AGP with periods, full lønn
- refusjon = {beloepPerMaaned: 25000, endringer: [{beloep: 0, startdato}]}

### 4. med_refusjon_uten_endringer
**Title:** Med refusjon, uten endringer
- AGP with periods, full lønn
- refusjon = {beloepPerMaaned: 25000, endringer: []}

### 5. med_refusjon_flere_endringer
**Title:** Med refusjon og flere endringer i beløp
- AGP with periods, full lønn
- refusjon = {beloepPerMaaned: 25000, endringer: [{beloep: 140}, {beloep: 150}, {beloep: 160}]}

### 6. ingen_arbeidsgiverperiode
**Title:** Ingen arbeidsgiverperiode
- agp = null (or empty perioder)
- Shows "Ingen arbeidsgiverperiode" text

### 7. med_inntekt_endring_enkel
**Title:** Med endringsårsak for inntekt (varig lønnsendring)
- inntekt.endringAarsaker = [{aarsak: "VarigLoennsendring", gjelderFra: "2024-12-24"}]

### 8. med_inntekt_endring_ferie
**Title:** Med endringsårsak for inntekt (ferie med perioder)
- inntekt.endringAarsaker = [{aarsak: "Ferie", perioder: [...]}]

### 9. med_flere_endringsaarsaker
**Title:** Med flere endringsårsaker for inntekt
- inntekt.endringAarsaker = [{aarsak: "Bonus"}, {aarsak: "Tariffendring", gjelderFra, bleKjent}]

### 10. uten_inntekt
**Title:** Uten inntekt (ikke oppgitt)
- inntekt = null

### 11. med_naturalytelser
**Title:** Med bortfall av naturalytelser
- naturalytelser = [{naturalytelse: "BIL", verdiBeloep: 3500, sluttdato}, {naturalytelse: "ELEKTRONISKKOMMUNIKASJON", ...}]

### 12. fisker_type
**Title:** Fisker med hyre
- tittelTillegg = ", fisker med hyre"

### 13. behandlingsdager_type
**Title:** Behandlingsdager
- tittelTillegg = ", behandlingsdager"

### 14. agp_ikke_forespurt
**Title:** AGP ikke forespurt
- tittelTillegg = ", arbeidsgiverperiode – ikke forespurt"

### 15. med_flere_arbeidsforhold
**Title:** Med flere arbeidsforhold (ulik lønn)
- Shows table with arbeidsforhold (yrkesbeskrivelse, stillingsprosent, inntekt)
- harLikLoenn = false, erSykmeldtFraAlle = false

### 16. med_flere_arbeidsforhold_lik_loenn
**Title:** Med flere arbeidsforhold (lik lønn)
- Shows questions but no table
- harLikLoenn = true, erSykmeldtFraAlle = true

## Important Notes
- The pdfgen template uses OpenHTMLtoPDF (XHTML strict), must use older HTML
- Style matches: Source Sans Pro font, dark (#00213d) / bright (#e6f0f7) info boxes
- Period rows have light blue bg (#eef4f9) with rounded corners
- Template uses custom Handlebars helpers: iso_to_date, iso_to_nor_datetime, duration, inc, eq, gt
- Partials: periodeMedAntallDager, sykmeldtOgArbeidsgiverInfo, valueOrDash