# Asifah Analytics

**Open-source conflict and stability monitoring — convergence, not prediction**

عاصفة (ʿāṣifah) — Arabic: *storm*

> **What this is.** A one-person project, built on nights and weekends, running
> on free tiers and stubbornness. No affiliation with or endorsement by any
> government or organisation. If it has been useful to you,
> ☕ [a coffee](https://buymeacoffee.com/asifahanalytics) pays for the hosting
> that keeps it up.

**Live site:** [asifahanalytics.com](https://asifahanalytics.com)

© 2025–2026 RCGG. All rights reserved.

---

## What this is

Asifah Analytics watches open sources for signs that pressure is building in the
same place from more than one direction at once.

It is not a forecasting tool. It does not assign probabilities to events, predict
attacks, or tell you what happens next. What it does is read a lot of public
reporting across a lot of countries, classify what it finds along several
independent axes — rhetoric, kinetic activity, humanitarian stress, commodity and
corridor pressure — and surface the places where those axes are lighting up
together. A single hot signal is a country story. Four axes converging on one
country in the same cycle is a question worth asking, and asking it is the
reader's job, not the software's.

Everything runs on free, publicly available sources. There is no privileged
information here, no proprietary feed, and nothing that could not be reproduced
by anyone with the same patience and a worse weekend hobby.

---

## How to read anything on this site

These rules govern every number, chip and sentence the platform produces. They
are the difference between a tool that is useful and a dashboard that is merely
confident.

**Convergence, not prediction.** Scores are composites of signal volume and
severity — weighted counts of categorised public statements and reported events.
They are not probabilities of action and must never be read as such. The platform
reports what it observed. The reader completes the inference.

**`unknown` is a state, never a silence.** When a sensor cannot read something,
the platform says so. It does not substitute a zero, a neutral value, or a
reassuring default. A gap that renders as calm is worse than no reading at all,
because it is quotable.

**A real zero is not an unread zero.** "We measured this and found nothing" and
"nobody measured this" are different findings and are displayed differently
throughout. Where a sensor has not been built for a country, that country is
marked unread rather than quiet.

**Absence is reported, not inferred.** Countries without a tracker are absent
from a regional read — they are not assessed as stable. Coverage gaps appear on
the page as coverage gaps.

**Silence can be the signal.** For actors that normally claim their operations,
going quiet against their own baseline is read as a change in tempo, not as calm.

**Claims are labelled as claims.** Much open-source reporting on contested
theatres originates with interested parties. Where a reading rests on
unconfirmed claims, the platform says whose claims they are and declines to
treat them as established fact.

**Every layer up gets a narrower lens.** Country pages show everything their
sensors emit. Regional summaries gate to what clears a threshold. The global
index narrows again. Nothing is hidden; altitude decides what competes for
attention.

---

## What's on the site

132 pages, generated and maintained by hand, organised in four layers.

| Layer | Pages | What it does |
|---|---|---|
| **Global** | `gpi.html`, `index.html`, `commodities.html`, `market-watch.html`, `military.html` | The Global Pressure Index — every theatre, every axis, one read. Plus cross-cutting commodity, market and military views. |
| **Regional hubs** | `africa.html`, `asia.html`, `europe.html`, `middle-east.html`, `wha.html` | Five theatres. Each rolls up its country trackers into a regional posture and feeds the global index. |
| **Rhetoric trackers** | 44 country pages (`rhetoric-*.html`) | Per-country escalation reads: who is saying what, at what level, against what baseline, and whether the picture is moving. |
| **Stability pages** | 65 country pages (`*-stability.html`) | Deeper per-country context — economic, humanitarian, political and conflict indicators. |

**Thematic and reference:** `mission.html`, `rhetoric-index.html`,
`captagon-trade.html`, `hizballah-financing.html`, `iran-protests.html`,
`syria-conflicts.html`, `privacy.html`, plus one-pager PDFs under `resources/`.

### Running through all of it

- **Spoke and wheel** — external patrons (Russia, Turkey, Iran, China and others)
  are tracked as hubs with rims of client and contested states, so a patron
  activating its network in several places at once is visible as one finding
  rather than several unrelated ones.
- **Trajectory** — for the theatres that support it, the platform reads not just
  whether a patron is *present* but whether it is gaining or losing ground, with
  the evidence class and source confidence attached.
- **Convergence detection** — a registry of defined convergences fires when
  independent axes meet the conditions for a named pattern in the same country.
- **Red lines** — per-country thresholds that report BREACHED only on an observed
  event, never on a hot vector alone.
- **Light/dark theming** and a shared UI shell across pages.

---

## Architecture

Static front end, six independent Flask services, one shared cache.

```
Public sources  ──►  Theatre backends  ──►  Shared Redis  ──►  Regional BLUFs
 (news, RSS,          (Flask / Render)       (Upstash)          │
  GDELT, social,                                                ▼
  market data)                                    Global Pressure Index
                                                                │
                                                                ▼
                                             Static pages on GitHub Pages
```

| Service | Scope |
|---|---|
| `asifah-backend` | Middle East & North Africa; also hosts the global index, convergence and commodity layers |
| `asifa-europe-backend` | Europe and Eurasia |
| `asifah-asia-backend` | Asia and the Pacific |
| `asifah-wha-backend` | Western Hemisphere |
| `asifah-africa-backend` | Africa |
| `lebanon-stability-backend` | Lebanon economic indicators |

**Front end:** vanilla JavaScript, no build step, no framework. GitHub Pages with
a custom domain through Cloudflare. Shared stylesheet and shell script under
`resources/`.

**Why one shared cache:** every backend reads the same keyspace, so a country
tracked in one theatre is visible to all of them without cross-service HTTP.
One writer, many readers — the rule that keeps two services from quietly
disagreeing about the same country.

---

## Where the data comes from

Free and publicly accessible sources only.

- **GDELT** — global event database with geolocation and multilingual coverage
- **RSS and wire feeds** — regional outlets, humanitarian reporting, think-tank
  publications, human-rights monitors
- **Social and messaging signals** — public, unauthenticated endpoints only
- **Market and commodity data** — public pricing and volatility indicators
- **Aviation notices** — active NOTAMs for monitored airspace
- **UN and NGO reporting** — displacement, food security and humanitarian figures

Update cadence varies by source and theatre, typically twice daily per country
tracker, with regional and global layers rebuilding on top of whatever the
trackers last wrote. Pages state when they were last generated. Backends run on
free tiers that sleep when idle, so the first request after a quiet period can
take 30–60 seconds.

---

## What this is not

Stated plainly, because a tool that hides its limits is worse than one that has
none.

- **Not a forecast.** No probabilities of action, no dates, no "will."
- **Not operational intelligence.** Public sources only. Nothing here should
  inform a decision that matters without corroboration from sources that do.
- **Keyword and pattern based.** Classification rests on weighted phrase matching
  against curated vocabularies, not on language models. It cannot read sarcasm,
  irony or implication, and it will sometimes match the wrong sense of a word.
- **English-weighted.** Arabic, Hebrew, Farsi, French and Russian sources are in
  the corpus, but scoring vocabularies are richest in English.
- **Sensitive to coverage, not just to events.** A quiet country may be quiet, or
  may be under-reported. The platform marks what it could not read, but it cannot
  conjure reporting that does not exist.
- **Single-maintainer.** Sensors are built one country at a time. The map of
  what is covered is not a map of what matters.

---

## Disclaimer

**This is a personal research project.** It is not an official product of any
government, agency, institution or employer, and it does not represent the
assessments of any of them. No affiliation or endorsement is claimed or implied.

Output is derived entirely from public reporting and is illustrative. It is not
suitable for operational use, and past media coverage does not establish what
happens next. Readers are responsible for applying their own judgement and for
corroborating anything here before relying on it.

---

## Licence

**© 2025–2026 RCGG. All rights reserved.** Proprietary — see
[`License`](./License).

Copying, modifying, redistributing, sublicensing or commercially exploiting this
software, in whole or in part, requires prior written permission from the
copyright holder. Reading the code and the site is, of course, free.

Donations support hosting costs. They buy no licence, no warranty, no support
obligation and no influence over what gets built.

---

## Contact

- **Email:** [asifahanalytics@gmail.com](mailto:asifahanalytics@gmail.com)
- **Instagram:** [@asifahanalytics](https://instagram.com/asifahanalytics)
- **Support:** ☕ [Buy Me a Coffee](https://buymeacoffee.com/asifahanalytics)

---

*Last updated: 5 October 2026*
