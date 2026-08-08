"use client";

import { useRef, useState } from "react";
import Home from "@/components/session/Home";

/**
 * The home screen in isolation, so the screenshot picker can be driven
 * without signing in. Not linked from anywhere.
 */
export default function HomeCheck() {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const pickerRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-dvh">
      <input
        ref={pickerRef}
        data-testid="picker"
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => {
          const picked = Array.from(event.target.files ?? []);
          setFiles((current) => [...current, ...picked].slice(0, 6));
          event.target.value = "";
        }}
      />
      <Home
        pastedText={text}
        screenshots={files.map((f, i) => ({ id: `${i}-${f.name}`, name: f.name }))}
        onPaste={setText}
        onAddScreenshot={() => pickerRef.current?.click()}
        onRemoveScreenshot={(id) =>
          setFiles((current) => current.filter((f, i) => `${i}-${f.name}` !== id))
        }
      />
    </div>
  );
}
