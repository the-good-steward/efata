"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Plays back a just-made recording.
 *
 * A blob from MediaRecorder carries no duration: the container is
 * written as a live stream, so the browser reports Infinity, refuses to
 * seek, and playback stops early or snaps back to zero. The audio
 * itself is intact — which is why the transcript came out complete
 * while the player looked broken.
 *
 * The fix is the standard one: seek far past the end, which forces the
 * browser to scan the file and work out the real duration, then return
 * to the start. Nothing is audible because it happens before play.
 */
export function AnswerPlayback({ blob }: { blob: Blob }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [ready, setReady] = useState(false);

  const url = useMemo(() => URL.createObjectURL(blob), [blob]);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !url) return;

    let settled = false;

    const onMetadata = () => {
      if (settled) return;

      if (audio.duration === Infinity || Number.isNaN(audio.duration)) {
        // Forces the browser to read to the end and learn the duration.
        audio.currentTime = 1e101;
        return;
      }

      settled = true;
      audio.currentTime = 0;
      setReady(true);
    };

    audio.addEventListener("loadedmetadata", onMetadata);
    audio.addEventListener("durationchange", onMetadata);

    return () => {
      audio.removeEventListener("loadedmetadata", onMetadata);
      audio.removeEventListener("durationchange", onMetadata);
    };
  }, [url]);

  return (
    <div>
      <audio ref={audioRef} controls src={url} preload="metadata" className="w-full" />
      {!ready && (
        <p className="ef-caption text-faint mt-2">Preparing playback…</p>
      )}
    </div>
  );
}
