# ApiCore Beekeeping App — AI-Generated Content Reference Glossary

**Document purpose:** This file documents every value that was manually assigned or AI-generated
within the ApiCore system. None of these values come from a dataset or scientific publication
unless explicitly noted. They are reasonable approximations based on general botanical and
apicultural knowledge, and should be reviewed by a domain expert before being used for
professional beekeeping decisions.

**Last updated:** 2026 | **App version:** Current production build

---

## Table of Contents

1. [Sri Lanka Agro-Climatic Zones](#1-sri-lanka-agro-climatic-zones)
2. [Forage Plant Reference (planning.ts — 29 plants)](#2-forage-plant-reference-planningts--29-plants)
3. [GBIF-Sourced Forage Species (gbifForage.ts — 34 species)](#3-gbif-sourced-forage-species-gbifforagets--34-species)
4. [Forage Availability Tiers](#4-forage-availability-tiers)
5. [Resource Type Definitions](#5-resource-type-definitions)
6. [GBIF Forage Grade System](#6-gbif-forage-grade-system)
7. [Temperature Status Thresholds](#7-temperature-status-thresholds)
8. [Humidity Status Thresholds](#8-humidity-status-thresholds)
9. [Rainfall Status Thresholds](#9-rainfall-status-thresholds)
10. [Location Suitability Score](#10-location-suitability-score)
11. [WMO Weather Code → Icon Reference](#11-wmo-weather-code--icon-reference)
12. [GBIF Biodiversity Bonus](#12-gbif-biodiversity-bonus)
13. [Known Limitations and Caveats](#13-known-limitations-and-caveats)

---

## 1. Sri Lanka Agro-Climatic Zones

The system assigns each forage plant to one or more zones. These zones are simplified from
Sri Lanka's Department of Agriculture classification.

| Zone Code | Zone Name | Description | Annual Rainfall |
|-----------|-----------|-------------|-----------------|
| `wet` | Wet Zone | Western, Sabaragamuwa, Central provinces | > 2500 mm/year |
| `dry` | Dry Zone | North, North-Central, Eastern, Southern (inland) | 1200–1900 mm/year |
| `mid` | Intermediate / Mid-Country | Buffer areas between wet and dry | 1900–2500 mm/year |
| `all` | All Zones | Found throughout Sri Lanka | Any |

> **⚠ Note:** Zone assignments in the system are manually approximated. A plant listed as
> `wet` may also grow in `mid` zones; the system shows only the primary zone.

---

## 2. Forage Plant Reference (planning.ts — 29 plants)

This is the core forage database used when the system calculates "currently blooming" and
"upcoming blooms" for a location. All values in the **Resource**, **Availability**, and
**Bloom Months** columns are **manually assigned** — they are NOT derived from any external
dataset.

Bloom months use calendar months: 1 = January, 12 = December.

### 2a. GBIF-Confirmed Plants (18 species)
*These species also appear in the GBIF field observation dataset used by the app.*

| Common Name | Scientific Name | Resource | Availability | Bloom Months | Zone | Notes |
|-------------|----------------|----------|-------------|-------------|------|-------|
| Calotropis / Wara | *Calotropis gigantea* (L.) Dryand. | Nectar | Abundant | Jan–Dec | All | Prolific nectar source; flowering Nov–Apr per Wikipedia but widely year-round in Sri Lanka's climate |
| Coconut | *Cocos nucifera* L. | Pollen | Abundant | Jan–Dec | All | Continuous bloomer in tropics; important pollen source |
| Blue Pea | *Clitoria ternatea* L. | Nectar | Moderate | Jan–Dec | All | Herbaceous legume; bees visit regularly |
| Indian Lotus | *Nelumbo nucifera* Gaertn. | Nectar | Moderate | Jun–Sep | All | Blooms during wet/monsoon months in tanks and wetlands |
| Golden Shower | *Cassia fistula* L. | Pollen | Moderate | Mar–Jun | All | Large yellow flower clusters; main flush Apr–May in Sri Lanka |
| Mango | *Mangifera indica* L. | Nectar | Abundant | Jan–Mar | Dry | Major honey-flow tree; blooms Jan–Mar in dry zone |
| Kithul Palm | *Caryota urens* L. | Nectar | Moderate | Jan–Dec | Wet | Monocarpic inflorescences produce nectar when tapped; UNESCO-listed traditional crop in Sri Lanka (2025) |
| Jackfruit | *Artocarpus heterophyllus* Lam. | Nectar | Moderate | Feb–May | Wet | Large cauliflorous flowers; bees collect from flower clusters |
| Jamun / Lovi | *Syzygium cumini* (L.) Skeels | Nectar | Moderate | Mar–May | All | Common roadside tree; nectar-rich flowers |
| Ceylon Olive | *Syzygium caryophyllatum* (L.) Alston | Nectar | Moderate | Apr–Jul | Wet | Endemic to Sri Lanka and S. India; IUCN Vulnerable (VU) |
| Coffee | *Coffea arabica* L. | Nectar | Moderate | Apr–Jun | Mid | Fragrant white flowers; secondary Arabica cultivation in mid-country |
| Tamarind | *Tamarindus indica* L. | Nectar | Low | Mar–Jun | Dry | Small pale flowers; minor nectar source |
| Sea Almond / Kotamba | *Terminalia catappa* L. | Nectar | Moderate | Mar–Jul | All | Coastal and inland; bees collect from inconspicuous flowers |
| Bo Tree / Bodhi | *Ficus religiosa* L. | Pollen | Low | Jan–Dec | All | Wind-pollinated; bees collect pollen opportunistically |
| Blue Water Lily / Nil Manel | *Nymphaea nouchali* Burm.f. | Pollen | Moderate | Jan–Dec | All | National flower of Sri Lanka; pollen collected from open blooms |
| Flame Lily / Niyagala | *Gloriosa superba* L. | Pollen | Moderate | Aug–Nov | All | Climbing lily; late wet season bloom |
| Arjun Tree | *Terminalia arjuna* (Roxb. ex DC.) Wight & Arn. | Nectar | Moderate | Apr–Jul | All | Riverside and wetland margins |
| Wild Cinnamon | *Cinnamomum verum* J.Presl | Pollen | Low | Mar–May | Wet | Sri Lanka's endemic cinnamon; small yellowish-white flowers; minor pollen source |

### 2b. Non-GBIF Plants (11 species)
*These species do not appear in the GBIF dataset used by the app. Their data is entirely manually assigned.*

| Common Name | Scientific Name | Resource | Availability | Bloom Months | Zone | Notes |
|-------------|----------------|----------|-------------|-------------|------|-------|
| Rubber | *Hevea brasiliensis* (Willd. ex A.Juss.) Müll.Arg. | Nectar | Abundant | Mar–May | Wet | Wintering flush; extrafloral nectaries on leaves and flowers |
| Rambutan | *Nephelium lappaceum* L. | Nectar | Abundant | May–Jul | Wet | Strong nectar flow; beekeepers often place hives in rambutan orchards |
| Durian | *Durio zibethinus* Murray | Nectar | Moderate | Apr–Jun | Wet | Bat-pollinated primarily but bees also visit |
| Eucalyptus | *Eucalyptus* spp. | Nectar | Abundant | Jun–Oct | Mid | Plantation species; major honey source; species vary by plantation |
| Maize / Corn | *Zea mays* L. | Pollen | Moderate | Mar–Aug | Dry | Wind-pollinated crop; bees collect abundant pollen from tassels |
| Sesame / Thala | *Sesamum indicum* L. | Nectar | Moderate | Jun–Sep | Dry | Important oil crop; good nectar source for bees |
| Guava | *Psidium guajava* L. | Nectar | Moderate | Mar–May | All | Two crops/year; nectar collected from stamens |
| Neem / Kohomba | *Azadirachta indica* A.Juss. | Nectar | Moderate | Feb–Apr | Dry | Small white flowers in panicles; minor nectar |
| Pumpkin / Wattakka | *Cucurbita moschata* Duchesne | Pollen | Moderate | Sep–Dec | All | ⚠ **Corrected:** original code used *C. maxima*; *C. moschata* is the species most commonly grown in Sri Lanka (hot/humid-tolerant) |
| Sunflower | *Helianthus annuus* L. | Nectar | Abundant | Jul–Oct | Dry | Cultivated crop; excellent nectar and pollen source |
| Wild Mango / Aetamba | *Mangifera zeylanica* (Blume) Hook.f. | Nectar | Moderate | Jan–Mar | Dry | Endemic to Sri Lanka (IUCN Vulnerable); grows in wet/intermediate zones along waterways; bloom timing parallels *M. indica* |

> **⚠ Correction note:** The system's source code (`planning.ts`) still uses `Cucurbita maxima`
> for Pumpkin. The botanically correct species for Sri Lanka is *Cucurbita moschata*, which
> is more tolerant of tropical heat and humidity. This should be corrected in a future update.

---

## 3. GBIF-Sourced Forage Species (gbifForage.ts — 34 species)

These 34 species appear in the GBIF occurrence dataset (`0017890-260108223611665.csv`) with
field observations recorded in Sri Lanka. Their **presence** (GPS coordinates) is verified by
GBIF field data. However, the **grade**, **resources**, and **bloom months** in this table are
**manually assigned** — GBIF records contain only: species name, GPS coordinates, and
collection date (not bloom date).

| Common Name | Scientific Name | Grade | Resources | Bloom Months (Manual) |
|-------------|----------------|-------|-----------|----------------------|
| Calotropis / Wara | *Calotropis gigantea* | Excellent | Nectar | Jan–Dec |
| Rainbow Gum | *Eucalyptus deglupta* | Excellent | Nectar | Jun–Oct |
| Coconut | *Cocos nucifera* | High | Pollen | Jan–Dec |
| Blue Pea | *Clitoria ternatea* | High | Nectar | Jan–Dec |
| Indian Lotus | *Nelumbo nucifera* | High | Nectar | Jun–Sep |
| Golden Shower | *Cassia fistula* | High | Pollen | Mar–Jun |
| Pink Shower / Senna | *Cassia roxburghii* | High | Pollen | Apr–Jul |
| Mango | *Mangifera indica* | High | Nectar | Jan–Mar |
| Kithul Palm | *Caryota urens* | High | Nectar | Jan–Dec |
| Ceylon Olive | *Syzygium caryophyllatum* | High | Nectar | Apr–Jul |
| Jamun | *Syzygium cumini* | High | Nectar | Mar–May |
| Coffee (Arabica) | *Coffea arabica* | High | Nectar | Apr–Jun |
| Coffee (Liberica) | *Coffea liberica* | High | Nectar | Mar–Jun |
| Breadfruit | *Artocarpus altilis* | Medium | Nectar | Feb–May |
| Jackfruit | *Artocarpus heterophyllus* | Medium | Nectar | Feb–May |
| Fish Poison Tree | *Barringtonia asiatica* | Medium | Nectar | May–Aug |
| Siam Weed | *Chromolaena odorata* | Low | Nectar | Nov–Jan |
| Banyan | *Ficus benghalensis* | Medium | Pollen | Jan–Dec |
| Cluster Fig | *Ficus racemosa* | Medium | Pollen | Jan–Dec |
| Bo Tree | *Ficus religiosa* | Medium | Pollen | Jan–Dec |
| Flame Lily | *Gloriosa superba* | Medium | Pollen | Aug–Nov |
| Lantana | *Lantana camara* | Medium | Nectar | Jan–Dec |
| Sensitive Plant | *Mimosa pudica* | Low | Pollen | Jun–Oct |
| Blue Water Lily | *Nymphaea nouchali* | Medium | Pollen | Jan–Dec |
| Red Water Lily | *Nymphaea pubescens* | Medium | Pollen | Jan–Dec |
| Ruby Water Lily | *Nymphaea rubra* | Medium | Pollen | Jan–Dec |
| Rice | *Oryza sativa* | Low | Pollen | Jun–Aug |
| Brinjal / Eggplant | *Solanum melongena* | Medium | Pollen | Jan–Dec |
| Tamarind | *Tamarindus indica* | Medium | Nectar | Mar–Jun |
| Arjun Tree | *Terminalia arjuna* | Medium | Nectar | Apr–Jul |
| Sea Almond | *Terminalia catappa* | Medium | Nectar | Mar–Jul |
| Coat Buttons | *Tridax procumbens* | Medium | Nectar | Jan–Dec |
| Wild Cinnamon | *Cinnamomum verum* | Low | Pollen | Mar–May |
| *(34th entry varies)* | — | — | — | — |

---

## 4. Forage Availability Tiers

The `availability` field in `planning.ts` describes how much nectar or pollen a plant
typically provides to bees relative to its bloom period. **All tier assignments are
manually estimated** — no chemical nectar volume data was used.

| Tier | Meaning | Typical characteristic |
|------|---------|----------------------|
| `abundant` | High-value forage; can support a full honey flow or rapid pollen collection | Large inflorescences, high nectar volume, or very high bee visitation rate. Examples: Rubber (*Hevea brasiliensis*), Mango (*Mangifera indica*), Sunflower (*Helianthus annuus*) |
| `moderate` | Useful supplemental forage; bees visit regularly but not exclusively | Mid-range nectar secretion or pollen production. Examples: most *Syzygium* spp., Jackfruit, Coffee |
| `low` | Minor or secondary forage; bees visit occasionally | Small flowers, low nectar volume, or primarily wind-pollinated. Examples: Tamarind (*Tamarindus indica*), Bo Tree (*Ficus religiosa*), Cinnamon (*Cinnamomum verum*) |

---

## 5. Resource Type Definitions

| Resource Type | Meaning |
|---------------|---------|
| `nectar` | Bees collect liquid nectar from this plant's flowers, which they convert to honey. The plant is a nectar source. |
| `pollen` | Bees collect pollen from this plant's anthers as a protein source for brood-rearing. Some pollen-type plants also have minor nectar. |

> **Note:** A plant listed as `nectar` may also provide some pollen, and vice versa. The
> system uses only one primary type per plant. No dual-resource plants are modelled.

---

## 6. GBIF Forage Grade System

Grades in `gbifForage.ts` describe how valuable each GBIF-confirmed species is as a forage
plant for honeybees. **All grades are manually assigned** — no standardised apicultural
scoring index was used.

| Grade | Criteria (manually defined) | Badge colour in UI |
|-------|----------------------------|-------------------|
| `excellent` | Top-tier forage; prolific nectar or pollen, long bloom, widely found in Sri Lanka, very high bee visitation documented | Gold / Amber |
| `high` | Major forage plant; good nectar or pollen, reliable seasonal bloom, significant for honey production | Emerald / Green |
| `medium` | Moderate forage value; bees visit but not a primary honey-flow plant; may be invasive or have short bloom | Blue |
| `low` | Minor forage; wind-pollinated, invasive weed, or bees rarely visit intentionally | Stone / Grey |

### Grade rationale for notable species:

- **Chromolaena odorata** (Siam Weed) → `low`: Invasive weed, bees do visit but considered a
  nuisance species; not desirable for managed beekeeping areas
- **Mimosa pudica** (Sensitive Plant) → `low`: Very small flowers; bees collect some pollen
  but negligible as a forage crop
- **Oryza sativa** (Rice) → `low`: Primarily wind-pollinated; bees occasionally collect pollen
  from rice flowers but it is not a reliable forage source
- **Eucalyptus deglupta** (Rainbow Gum) → `excellent`: Plantation species with very high
  nectar volume when in bloom; widely planted in Sri Lanka's mid-country

---

## 7. Temperature Status Thresholds

Used in the planning screen's "Current Weather" and forecast cards to classify foraging
conditions based on temperature (°C). **All thresholds are manually defined** based on
general apicultural guidance (Apis cerana dorsata and Apis mellifera behavior in tropics).

| Threshold | Label | Colour | Beekeeping meaning |
|-----------|-------|--------|-------------------|
| < 15 °C | **Too Cold** | 🔵 Blue | Below 15°C bees cluster inside the hive; no foraging expected |
| 15–19 °C | **Cool** | 🩵 Cyan | Reduced foraging activity; bees may fly short distances |
| 20–35 °C | **Optimal** | 🟢 Green | Ideal foraging temperature range for tropical honeybees |
| 36–40 °C | **Warm** | 🟠 Orange | Bees reduce activity; provide shade and water at apiary |
| > 40 °C | **Too Hot** | 🔴 Red | Above 40°C causes heat stress; bees beard outside hive |

> **Reference context:** *Apis cerana* is commonly active 18–37°C; *Apis mellifera* forages
> actively 15–40°C. The "Optimal" range 20–35°C is conservative and appropriate for Sri Lanka.

---

## 8. Humidity Status Thresholds

Used to classify relative humidity (%) for foraging conditions. **All thresholds are
manually defined.**

| Threshold | Label | Colour | Beekeeping meaning |
|-----------|-------|--------|-------------------|
| < 40% RH | **Dry** | 🟠 Orange | Low humidity reduces nectar secretion in many plants |
| 40–70% RH | **Good** | 🟢 Green | Optimal humidity for most tropical nectar-producing plants |
| 71–85% RH | **Humid** | 🟡 Yellow | Elevated humidity; foraging still possible but nectar may be diluted |
| > 85% RH | **Very Humid** | 🔴 Red | Very high humidity can trap bees in hive, promote fungal disease |

---

## 9. Rainfall Status Thresholds

Used to classify hourly precipitation (mm) in weather cards. **All thresholds are manually
defined.** Note: the system uses *precipitation mm* from Open-Meteo's WMO data, which
represents hourly accumulated rainfall.

| Threshold | Label | Colour | Foraging impact |
|-----------|-------|--------|----------------|
| < 1 mm | **No Rain** | 🟢 Green | Clear conditions; optimal for foraging |
| 1–4.9 mm | **Light Rain** | 🔵 Blue | Light drizzle; bees may still fly but return rates drop |
| 5–14.9 mm | **Moderate Rain** | 🟠 Orange | Moderate rain; most bees shelter in hive |
| ≥ 15 mm | **Heavy Rain** | 🔴 Red | Heavy rain; bees confined to hive; check for hive flooding |

---

## 10. Location Suitability Score

The **suitability score** is a 0–100 integer computed in `planningService.analyze()` for
the selected location and date range. It is derived **entirely from manually defined
penalty rules** — no external suitability index or scientific model is used.

### Scoring Formula

```
Start: 100 points

Penalties applied from weather averages over the selected date range:
  avgTemp < 15°C   OR  avgTemp > 40°C   →  −40 pts   (extreme temperature)
  avgTemp < 20°C   OR  avgTemp > 35°C   →  −15 pts   (sub-optimal temperature)
  avgHumidity > 85%                      →  −20 pts   (very high humidity)
  avgHumidity < 40%                      →  −15 pts   (too dry)
  totalRain > 50 mm (over period)        →  −20 pts   (excessive rainfall)
  totalRain < 1 mm  (over period)        →   −5 pts   (drought risk, low nectar)

Clamp result to 0–100.

Then add GBIF Biodiversity Bonus (0–15 pts) — see Section 12.
```

### Score Labels

| Score Range | Label | Colour | Interpretation |
|-------------|-------|--------|---------------|
| ≥ 75 | **Excellent** | 🟢 Green | Strongly recommended for hive placement or new apiary |
| 55–74 | **Good** | 🟡 Lime | Suitable; minor weather concerns |
| 35–54 | **Fair** | 🟠 Orange | Acceptable with caution; check specific risk factors |
| < 35 | **Poor** | 🔴 Red | Not recommended; significant foraging or weather risks |

---

## 11. WMO Weather Code → Icon Reference

The app uses the **Open-Meteo API** which returns weather conditions as **WMO 4677 weather
codes**. The following mapping converts those codes to display icons. This mapping is
standard and follows the WMO specification (not manually invented).

| WMO Code Range | Emoji | Meaning |
|---------------|-------|---------|
| 0 | ☀️ | Clear sky |
| 1 | ⛅ | Mainly clear |
| 2 | ⛅ | Partly cloudy |
| 3 | ☁️ | Overcast |
| 45–49 | 🌫️ | Fog / Depositing rime fog |
| 51–59 | 🌦️ | Drizzle (light, moderate, dense) |
| 61–69 | 🌧️ | Rain (slight, moderate, heavy; freezing rain) |
| 71–79 | ❄️ | Snow / Snow grains / Ice crystals |
| 80–82 | 🌧️ | Rain showers (slight, moderate, violent) |
| 83–84 | ⛈️ | Snow showers / Slight/heavy |
| 85–99 | ⛈️ | Thunderstorm (slight, moderate, heavy; with hail) |

> **Beekeeping relevance:** Codes 0–3 represent flyable conditions. Codes 45+ indicate
> bees should be expected to stay in the hive. Code 0 (clear sky) combined with
> temperature 20–35°C and humidity 40–70% represents peak foraging conditions.

### Forecast Card Fields Explained

Each day in the 14-day forecast displays:

| Field | Source | Description |
|-------|--------|-------------|
| Day name & date | Open-Meteo | Calendar date of the forecast day |
| Weather emoji | WMO code (above table) | Visual representation of dominant weather |
| Max °C / Min °C | Open-Meteo `temperature_2m_max/min` | Daily temperature range at 2 m height |
| Precipitation (mm) | Open-Meteo `precipitation_sum` | Total daily rainfall in millimetres |
| Humidity (%) | Open-Meteo `relative_humidity_2m` (hourly avg) | Relative humidity percentage |
| Suitability label | Computed (Section 10) | Foraging quality assessment for that day |

---

## 12. GBIF Biodiversity Bonus

When the system finds GBIF-verified forage plant observations near the selected location
(within a configurable search radius), it adds a **biodiversity bonus** to the suitability
score. This rewards locations with higher verified forage diversity.

### Bonus Formula (manually defined)

```
gbifScore = min(100, (number of distinct species found nearby) × configurable multiplier)

Biodiversity bonus added to suitability score:
  gbifScore ≥ 80  →  +15 pts
  gbifScore ≥ 60  →  +10 pts
  gbifScore ≥ 40  →   +7 pts
  gbifScore ≥ 20  →   +3 pts
  gbifScore < 20  →   +0 pts
```

> The GBIF score displayed in the UI (0–100 bar) represents forage biodiversity richness
> near the location based on field-verified plant observations from the GBIF dataset
> `0017890-260108223611665.csv` (Sri Lanka occurrences, downloaded 2026).

---

## 13. Known Limitations and Caveats

### Scientific Name Issues

| Issue | Status |
|-------|--------|
| `Cucurbita maxima` used for Pumpkin in code | **Incorrect for Sri Lanka.** Should be *Cucurbita moschata* which is the hot/humid-tolerant pumpkin grown in Sri Lanka. Pending code fix. |
| `Mangifera zeylanica` | ✅ **Correct.** Verified valid endemic Sri Lanka species (IUCN Vulnerable). Also called "Aetamba" / "Wal Amba" in Sinhala. |
| `Eucalyptus spp.` | Acceptable placeholder. Dominant plantation species in Sri Lanka are *E. camaldulensis* and *E. deglupta*. |
| `Syzygium caryophyllatum` | ✅ Correct endemic species; note IUCN Vulnerable status. |

### GBIF Data Limitations

- **GBIF `eventDate` ≠ bloom date.** The collection date in the CSV is when a botanist
  collected a specimen — this is often NOT when the plant was flowering. Bloom months
  in the system are based on botanical knowledge, not GBIF dates.
- **GBIF has no nectar or pollen data.** All `nectar`/`pollen` classifications, availability
  tiers, and grades are manually assigned.
- **Observation density ≠ plant abundance.** A species with 500 GBIF records may simply be
  a well-studied species, not necessarily more common than a species with 5 records.

### Weather Threshold Limitations

- All thresholds are designed for *Apis cerana* and *Apis mellifera* behaviour in tropical
  Sri Lanka conditions. They may not apply to *Apis dorsata* (giant honeybee) or
  *Tetragonula* (stingless bee) management.
- The suitability score is heuristic, not validated against actual honey yield data.
- Open-Meteo forecast accuracy decreases after Day 7; the 14-day forecast should be
  treated as approximate for Days 8–14.

### Bloom Month Limitations

- All bloom months represent **Sri Lanka averages**. Actual bloom onset varies by:
  - Elevation (plants in mid/up-country bloom later than lowland)
  - Monsoon timing (can shift by 2–4 weeks year to year)
  - Microclimate (coastal vs. inland)
- Plants listed as `Jan–Dec` bloom continuously at low intensity, not at equal intensity
  throughout the year.

---

*This document was generated as part of the ApiCore beekeeping management system.
All AI-generated values should be verified by a qualified apiculturist or botanist
before use in professional beekeeping operations.*
