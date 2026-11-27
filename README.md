# When The King Learns

A Japanese self-study website with a playful royal-court theme. Study kanji, listen to Japanese, and follow your progress in a Vietnamese/English interface.

**Live site:** [huyhuhu.github.io/WhenTheKingLearns](https://huyhuhu.github.io/WhenTheKingLearns/)

## Features

- Kanji learning and review flows (N5 content available; N4 and N3 are planned).
- Japanese audio and speech support for listening and pronunciation practice.
- Podcast player with karaoke-style lyrics, furigana, romaji, Vietnamese translations, chapters, playback-speed controls, background media controls, and episode downloads for offline listening.
- Achievements and royal-court progression, with progress backup and restore.
- Vietnamese and English interface, light and dark themes, and an installable web-app experience.
- N5 grammar: 78 patterns in 16 lessons that unlock with vocabulary progress, built as complexes on the map, with spaced repairs, four exercise types and two mini games.

**Mock Exams** is a planned section and is not yet available.

## Run locally

The site is static and has no frontend build step. From the repository root, start the included server:

```bash
python tools/serve.py 8765
```

Open <http://localhost:8765>. The server supports HTTP byte-range requests so podcast audio can seek during local testing.

## Deployment

GitHub Actions deploys the site to GitHub Pages when changes are pushed to `main`. No separate frontend build is required.

## Project layout

```text
.
├── index.html             # App entry point
├── manifest.webmanifest   # Web-app manifest
├── css/                   # Styles
├── js/                    # App, kanji, audio, podcast, and progression logic
├── data/                  # Learning data and podcast indexes
├── audio/                 # App audio assets
├── icons/                 # App icons
├── podcast/               # Podcast scripts and shared cast/configuration
├── tools/                 # Local server and content-generation utilities
└── docs/                  # Contributor and content-production notes
```

See [`docs/podcast.md`](docs/podcast.md) for podcast production details and the episode format, and [`docs/achievements-design.md`](docs/achievements-design.md) for the achievement system.
