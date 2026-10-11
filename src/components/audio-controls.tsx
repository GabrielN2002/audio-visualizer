import { cn } from "cn";
import { Pause, Play } from "lucide-react";
import { useState, type ComponentPropsWithoutRef, type RefObject } from "react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";

type AudioControlsProps = ComponentPropsWithoutRef<"audio"> & {
  ref: RefObject<HTMLAudioElement | null>;
};

function AudioControls({ ref, className, ...props }: AudioControlsProps) {
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  function updateDuration(audio: HTMLAudioElement) {
    setDuration(
      Number.isFinite(audio.duration) ? Math.max(0, audio.duration) : 0,
    );
  }

  return (
    <div
      className={cn(
        "bg-muted/30 flex items-center gap-3 rounded-xl border px-2 py-1",
        className,
      )}
    >
      <audio
        {...props}
        ref={ref}
        onLoadedMetadata={(event) => {
          updateDuration(event.currentTarget);
          setElapsed(event.currentTarget.currentTime);
          props.onLoadedMetadata?.(event);
        }}
        onDurationChange={(event) => {
          updateDuration(event.currentTarget);
          props.onDurationChange?.(event);
        }}
        onEmptied={(event) => {
          setElapsed(0);
          setDuration(0);
          setIsPlaying(false);
          props.onEmptied?.(event);
        }}
        onPlay={(event) => {
          setIsPlaying(true);
          props.onPlay?.(event);
        }}
        onPause={(event) => {
          setIsPlaying(false);
          props.onPause?.(event);
        }}
        onEnded={(event) => {
          setIsPlaying(false);
          props.onEnded?.(event);
        }}
        onTimeUpdate={(event) => {
          setElapsed(event.currentTarget.currentTime);
          props.onTimeUpdate?.(event);
        }}
      />

      <Button
        type="button"
        variant="ghost"
        aria-label={isPlaying ? "Pause" : "Play"}
        onClick={() => {
          const audio = ref.current;
          if (!audio) return;
          setPlaybackError(null);
          if (!audio.paused) {
            audio.pause();
          } else {
            void audio.play().catch((error: unknown) => {
              if (error instanceof DOMException && error.name === "AbortError")
                return;
              setPlaybackError(
                error instanceof Error
                  ? error.message
                  : "Unable to play this audio file.",
              );
            });
          }
        }}
      >
        {isPlaying ? <Pause /> : <Play />}
      </Button>
      <Slider
        min={0}
        max={duration || 1}
        step={0.1}
        disabled={duration <= 0}
        onValueChange={(value) => {
          const audio = ref.current;
          const nextTime = typeof value === "number" ? value : value[0];
          if (!audio || duration <= 0 || nextTime === undefined) return;

          const time = Math.max(0, Math.min(nextTime, duration));
          audio.currentTime = time;
          setElapsed(time);
        }}
        value={[Math.min(elapsed, duration)]}
      />
      {playbackError ? <p role="alert">{playbackError}</p> : null}
    </div>
  );
}

export default AudioControls;
