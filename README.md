# Audio Visualizer

A browser-based audio player that turns local audio files into a live frequency spectrum. Built with React, TypeScript, and the Web Audio API, it displays bass, midrange, and treble activity as animated bars.

## Features

- **Local audio playback:** select a file from your device and view its name, extension, and size.
- **Playback controls:** play, pause, and seek using the progress slider.
- **Two visualization modes:** bars that rise from the bottom, or mirrored bars that expand from the center.
- **Adjustable detail:** choose 8, 12, or 24 frequency bars. The default is 12.
- **Adjustable width:** choose Thin, Normal, or Wide bars.
- **Smoothed animation:** frequency levels update during playback and reset when playback pauses or ends.
- **Responsive layout:** the spectrum scrolls horizontally when the bars exceed the available width.
- **Light and dark styling:** the initial theme follows your system preference unless a saved theme exists.

## Getting started

### Requirements

- Node.js 20.19+ within the 20.x release line, or Node.js 22.12+ (matching the installed Vite engine requirement).
- npm.
- A browser with Web Audio API support.

From the project directory, install dependencies and start the development server:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. The development script uses `--host`, which also allows connections through available network interfaces.

No API keys, environment variables, or backend services are required.

## Usage

1. Click **Select audio file** and choose a file from your device.
2. Press **Play** to start playback and animate the spectrum.
3. Switch between **Bar** and **Mirror** to change the visualization.
4. Use **Width** and **Detail** to adjust the bars. Hover over a bar to see its frequency range.
5. Drag the playback slider to seek through the track.
6. Click the attachment's **Remove** button to stop playback and select another file.

Removing a file clears it from the app; it does not delete the original file from your device. Reloading the page also clears the selected audio.

The file picker accepts `.mp3`, `.m4a`, `.aac`, `.wav`, `.aif`, `.aiff`, `.flac`, `.ogg`, `.opus`, and `.weba` files. Playback depends on your browser's support for the file's codec and container; an accepted extension does not guarantee that it can be played.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite's development server with network access enabled. |
| `npm run build` | Run TypeScript checks and create a production build in `dist/`. |
| `npm run preview` | Serve the production build locally with network access enabled. |
| `npm run lint` | Check the project with Oxlint. |

To inspect a production build locally:

```sh
npm run build
npm run preview
```

The generated `dist/` directory can be deployed to a static hosting service. The preview server is intended for checking the build locally.

## How the visualization works

On playback, the app connects an HTML audio element to a Web Audio `AnalyserNode` and then to the audio output. It reads frequency data on each animation frame and groups it into approximately logarithmic bands, giving lower frequencies more space than a linear scale would.

The analyzer uses:

- An FFT size of **8192**.
- A frequency range from **20 Hz** to **20 kHz**, capped at half the audio context's sample rate.
- The peak decibel value within each band, normalized to a display range of **−70 to −15 dBFS** and clamped between 0 and 1.
- A smoothing time constant of **0.55**.

These bars show relative frequency activity, not calibrated speaker loudness. Analyzer settings and detail presets are defined in `src/hooks/useAudioanalyser.ts`.

## Technology stack

- **React 19 and TypeScript** for the interface and application state.
- **Vite 8** for development and production builds, with the React Compiler enabled.
- **Web Audio API** for real-time spectrum analysis.
- **Tailwind CSS 4**, **Base UI**, and local shadcn-style components for styling and controls.
- **Lucide React** for icons and **Oxlint** for linting.

## Project structure

```text
src/
├── App.tsx                         # App entry and theme provider
├── main.tsx                        # React mount point
├── index.css                       # Global styles and theme tokens
├── components/
│   ├── audio-visualizer.tsx         # Spectrum modes and display controls
│   ├── audio-controls.tsx           # Playback, seeking, and playback errors
│   ├── file-input.tsx               # File picker and attachment display
│   ├── theme-provider.tsx           # Theme state and local storage
│   └── ui/                         # Reusable interface components
└── hooks/
    ├── useAudioanalyser.ts          # Audio graph and frequency analysis
    └── useFileHandler.ts            # File metadata and object URL lifecycle
```

The `@/` import alias resolves to `src/`.

## Data handling and current scope

Selected audio is played and analyzed locally through a browser object URL; the app does not upload it to a server. Object URLs are released when files are removed or the component is unmounted. Removing audio also disconnects the analyzer and closes its audio context.

The app currently handles one local file at a time. It does not include microphone input, playlists, remote audio sources, recording, or visualization export. There is no automated test script configured; the available code checks are the TypeScript build and Oxlint.
