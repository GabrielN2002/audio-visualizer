import { useEffect, useRef, useState, type ChangeEvent } from "react";

type SongInfo = {
  title: string;
  extension?: string;
  size: number;
};

export function useFileHandler() {
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [songInfo, setSongInfo] = useState<SongInfo>({
    title: "",
    extension: "",
    size: 0,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const url = URL.createObjectURL(file);

    setAudioUrl(url);
    setSongInfo({
      title: file.name
        .replaceAll(/[^A-Za-z0-9.']/g, " ")
        .slice(0, file.name.indexOf(".")),
      extension: file.name.slice(file.name.indexOf(".") + 1).toUpperCase(),
      size: file.size / 1e6,
    });
  }

  function handleRemoveFile() {
    setAudioUrl(undefined);
    setSongInfo({ title: "", extension: "", size: 0 });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return {
    fileInputRef,
    audioUrl,
    songInfo,
    handleFileChange,
    handleRemoveFile,
  };
}
