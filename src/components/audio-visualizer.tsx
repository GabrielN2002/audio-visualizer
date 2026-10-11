import { useFileHandler } from "@/hooks/useFileHandler";
import { AudioWaveform } from "lucide-react";
import { useState } from "react";
import {
  DETAIL_PRESETS,
  useAudioAnalyzer,
  type DetailLevel,
  type FrequencyData,
} from "../hooks/useAudioanalyser";
import AudioControls from "./audio-controls";
import FileInput from "./file-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

function MirrorBarVisualizer({
  frequencies,
  detail,
  onDetailChange,
}: {
  frequencies: FrequencyData;
  detail: DetailLevel;
  onDetailChange: (d: DetailLevel) => void;
}) {
  return (
    <BarVisualizer
      frequencies={frequencies}
      detail={detail}
      onDetailChange={onDetailChange}
      symmetric
    />
  );
}

function BarVisualizer({
  frequencies,
  detail,
  onDetailChange,
  symmetric = false,
}: {
  frequencies: FrequencyData;
  detail: DetailLevel;
  onDetailChange: (d: DetailLevel) => void;
  symmetric?: boolean;
}) {
  const [barWidth, setBarWidth] = useState(5);
  const barCount = DETAIL_PRESETS[detail].barCount;

  return (
    <>
      <div className="flex gap-3">
        <Select
          onValueChange={(value) => {
            switch (value) {
              case "Thin":
                setBarWidth(5);
                break;

              case "Normal":
                setBarWidth(10);
                break;

              case "Wide":
                setBarWidth(15);
                break;

              default:
                break;
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Width" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Width</SelectLabel>
              {["Thin", "Normal", "Wide"].map((item, index) => (
                <SelectItem key={index} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Select
          value={detail}
          onValueChange={(value) => {
            if (value === "low" || value === "medium" || value === "high") {
              onDetailChange(value);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Detail" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Detail</SelectLabel>
              {(Object.keys(DETAIL_PRESETS) as DetailLevel[]).map((level) => (
                <SelectItem key={level} value={level}>
                  {DETAIL_PRESETS[level].label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto px-3 py-6 sm:px-6">
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${barCount}, minmax(0, 1fr))`,
            minWidth: `${barCount * (barWidth + 4) - 4}px`,
          }}
          role="img"
          aria-label={`Audio spectrum with ${barCount} ${symmetric ? "symmetric " : ""}frequency bars, from low to high frequencies`}
        >
          {frequencies.map(({ minHz, maxHz, level }, index) => (
            <div
              key={index}
              className={`bg-secondary mx-auto flex h-50 overflow-hidden rounded-full ${symmetric ? "flex-col justify-center" : "flex-col-reverse"}`}
              style={{ width: `${barWidth}px` }}
              title={`${Math.round(minHz)}–${Math.round(maxHz)} Hz`}
            >
              <div
                className="bg-foreground shrink-0"
                style={{ height: `${level * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="text-muted-foreground mt-2 flex justify-between text-xs">
          <span>{Math.round(frequencies[0]?.minHz ?? 20)} Hz</span>
          <span>
            {((frequencies.at(-1)?.maxHz ?? 20000) / 1000).toFixed(1)} kHz
          </span>
        </div>
      </div>
    </>
  );
}

export default function AudioVisualizer() {
  const {
    audioRef,
    frequencies,
    detailLevel,
    setDetailLevel,
    handlePlay,
    handlePause,
    resetAudio,
  } = useAudioAnalyzer();
  const fileHandler = useFileHandler();

  function handleRemoveFile() {
    audioRef.current?.pause();
    resetAudio();
    fileHandler.handleRemoveFile();
  }

  return (
    <main className="bg-muted/30 min-h-svh px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="bg-card flex size-10 shrink-0 items-center justify-center rounded-xl border">
              <AudioWaveform className="size-5" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Audio visualizer
            </h1>
          </div>
          <p className="text-muted-foreground text-sm leading-6">
            Choose a song and watch its low, mid, and high frequencies move.
          </p>
        </header>

        <FileInput {...fileHandler} handleRemoveFile={handleRemoveFile} />

        <section className="" aria-labelledby="frequencies-heading">
          <Tabs defaultValue="Bar">
            <div className="flex gap-5">
              <TabsList>
                <TabsTrigger value="Bar">Bar</TabsTrigger>
                <TabsTrigger value="Mirror">Mirror</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="Bar">
              <BarVisualizer
                detail={detailLevel}
                onDetailChange={setDetailLevel}
                frequencies={frequencies}
              />
            </TabsContent>

            <TabsContent value="Mirror">
              <MirrorBarVisualizer
                detail={detailLevel}
                onDetailChange={setDetailLevel}
                frequencies={frequencies}
              />
            </TabsContent>
          </Tabs>
          {fileHandler.audioUrl ? (
            <AudioControls
              key={fileHandler.audioUrl}
              ref={audioRef}
              src={fileHandler.audioUrl}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handlePause}
            />
          ) : null}
        </section>
      </div>
    </main>
  );
}
