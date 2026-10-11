import { FileHeadphone, Import, XIcon } from "lucide-react";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "./ui/attachment";
import { Label } from "./ui/label";
import type { useFileHandler } from "@/hooks/useFileHandler";

function FileInput({
  fileInputRef,
  audioUrl,
  songInfo,
  handleFileChange,
  handleRemoveFile,
}: ReturnType<typeof useFileHandler>) {
  return (
    <section aria-labelledby="audio-heading">
      <input
        ref={fileInputRef}
        className="peer sr-only"
        id="input"
        type="file"
        accept=".mp3,.m4a,.aac,.wav,.aif,.aiff,.flac,.ogg,.opus,.weba"
        aria-label="Select an audio file"
        disabled={Boolean(audioUrl)}
        onChange={handleFileChange}
      />
      {audioUrl ? (
        <div className="flex flex-col gap-5">
          <Attachment className="w-full flex-nowrap">
            <AttachmentMedia>
              <FileHeadphone />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle title={songInfo.title}>
                {songInfo.title}
              </AttachmentTitle>
              <AttachmentDescription>
                <div className="flex gap-3">
                  <span>{songInfo.size.toFixed(2)} MB</span>
                  <span>{songInfo.extension}</span>
                </div>
              </AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction
                onClick={handleRemoveFile}
                aria-label={`Remove ${songInfo.title}`}
              >
                <XIcon aria-hidden="true" />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        </div>
      ) : (
        <Label
          htmlFor="input"
          className="bg-muted/20 hover:bg-muted/50 peer-focus-visible:ring-ring flex min-h-40 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-6 text-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2"
        >
          <Import className="text-muted-foreground size-6" aria-hidden="true" />
          <span className="font-medium">Select audio file</span>
          <span className="text-muted-foreground text-xs font-normal">
            MP3, WAV, or another audio format
          </span>
        </Label>
      )}
    </section>
  );
}

export default FileInput;
