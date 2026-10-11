import { useEffect, useRef, useState } from "react";

export interface FrequencyBand {
  minHz: number;
  maxHz: number;
  level: number;
}

export type FrequencyData = FrequencyBand[];

// Display range for the meters, in dBFS (not speaker volume).
const METER_MIN_DB = -70;
const METER_MAX_DB = -15;
const FFT_SIZE = 8192;

export const DETAIL_PRESETS = {
  low: { label: "Low · 8 bars", barCount: 8 },
  medium: { label: "Medium · 12 bars", barCount: 12 },
  high: { label: "High · 24 bars", barCount: 24 },
} as const;

export type DetailLevel = keyof typeof DETAIL_PRESETS;

function createFrequencyBands(
  barCount: number,
  sampleRate = 48000,
): FrequencyData {
  const maxHz = Math.min(20000, sampleRate / 2);
  const minHz = Math.min(20, maxHz);
  const binHz = sampleRate / FFT_SIZE;
  const endIndex = Math.min(Math.ceil(maxHz / binHz), FFT_SIZE / 2);
  let startIndex = Math.max(1, Math.ceil(minHz / binHz));
  let bandMinHz = minHz;

  return Array.from({ length: barCount }, (_, index) => {
    // Equal frequency ratios give bass and mids more space than a linear axis.
    const targetHz = minHz * (maxHz / minHz) ** ((index + 1) / barCount);
    const remainingBands = barCount - index - 1;
    // Align boundaries to FFT bins and reserve at least one bin per band.
    const nextIndex = Math.min(
      endIndex - remainingBands,
      Math.max(startIndex + 1, Math.ceil(targetHz / binHz)),
    );
    const bandMaxHz = index === barCount - 1 ? maxHz : nextIndex * binHz;
    const band = { minHz: bandMinHz, maxHz: bandMaxHz, level: 0 };
    startIndex = nextIndex;
    bandMinHz = bandMaxHz;
    return band;
  });
}

export function useAudioAnalyzer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const frequencyDataRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const [frequencies, setFrequencies] = useState<FrequencyData>(() =>
    createFrequencyBands(DETAIL_PRESETS.medium.barCount),
  );

  const [detailLevel, setDetailLevelState] = useState<DetailLevel>("medium");

  const barCount = DETAIL_PRESETS[detailLevel].barCount;
  // The running animation loop must also see changes made after playback starts.
  const barCountRef = useRef<number>(barCount);

  function readFrequencyBands(count: number): FrequencyData {
    const bands = createFrequencyBands(
      count,
      audioContextRef.current?.sampleRate,
    );
    const data = frequencyDataRef.current;

    if (!data || audioRef.current?.paused !== false) return bands;

    return bands.map((band) => ({
      ...band,
      level: getBandLevel(data, band.minHz, band.maxHz),
    }));
  }

  function setDetailLevel(level: DetailLevel) {
    barCountRef.current = DETAIL_PRESETS[level].barCount;
    setDetailLevelState(level);
    setFrequencies(readFrequencyBands(barCountRef.current));
  }

  function setupAudio() {
    if (!audioRef.current) return;
    if (audioContextRef.current) return;

    const audioContext = new AudioContext();

    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.55;

    const source = audioContext.createMediaElementSource(audioRef.current);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    sourceRef.current = source;
    frequencyDataRef.current = new Float32Array(analyser.frequencyBinCount);
  }

  function getBandLevel(
    data: Float32Array,
    minHz: number,
    maxHz: number,
  ): number {
    const audioContext = audioContextRef.current;

    if (!audioContext) return 0;

    const nyquist = audioContext.sampleRate / 2;

    // Avoid floating-point rounding moving a bin-aligned boundary by one bin.
    const minIndex = Math.max(
      1,
      Math.ceil((minHz / nyquist) * data.length - 1e-9),
    );
    const endIndex = Math.min(
      Math.ceil((maxHz / nyquist) * data.length - 1e-9),
      data.length,
    );

    // A peak meter keeps strong notes from being diluted by quiet bins.
    let peakDb = -Infinity;
    for (let i = minIndex; i < endIndex; i++) {
      peakDb = Math.max(peakDb, data[i]);
    }

    return Math.max(
      0,
      Math.min(1, (peakDb - METER_MIN_DB) / (METER_MAX_DB - METER_MIN_DB)),
    );
  }

  function updateFrequencies() {
    const analyser = analyserRef.current;
    const data = frequencyDataRef.current;

    if (!analyser || !data) return;

    analyser.getFloatFrequencyData(data);

    setFrequencies(readFrequencyBands(barCountRef.current));

    animationFrameRef.current = requestAnimationFrame(updateFrequencies);
  }

  async function handlePlay() {
    setupAudio();

    const audioContext = audioContextRef.current;

    if (!audioContext) return;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    if (audioContextRef.current !== audioContext || audioRef.current?.paused)
      return;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    updateFrequencies();
  }

  function handlePause() {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setFrequencies((bands) => bands.map((band) => ({ ...band, level: 0 })));
  }

  function resetAudio() {
    handlePause();
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    void audioContextRef.current?.close();
    sourceRef.current = null;
    analyserRef.current = null;
    audioContextRef.current = null;
    frequencyDataRef.current = null;
  }

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      audioContextRef.current?.close();
    };
  }, []);

  return {
    audioRef,
    frequencies,
    detailLevel,
    setDetailLevel,
    barCount,
    handlePlay,
    handlePause,
    resetAudio,
  };
}
