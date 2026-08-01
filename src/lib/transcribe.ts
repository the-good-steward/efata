/**
 * Speech to text via Deepgram.
 *
 * Chosen over cheaper options because accent handling matters directly
 * here: the users are Filipino freelancers speaking English, and a
 * transcript that mangles their words produces feedback about mistakes
 * they did not make, which is worse than no feedback.
 */
export type Transcript = {
  text: string;
  durationSeconds: number;
};

export async function transcribeAudio(
  audio: ArrayBuffer,
  mimeType: string,
): Promise<Transcript> {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) throw new Error("DEEPGRAM_API_KEY is not set.");

  const params = new URLSearchParams({
    model: "nova-3",
    smart_format: "true",
    punctuate: "true",
    // Keeps filler words in the transcript. Removing them would hide
    // exactly what we want to give feedback on.
    filler_words: "true",
    language: "en",
  });

  const response = await fetch(
    `https://api.deepgram.com/v1/listen?${params.toString()}`,
    {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": mimeType,
      },
      body: audio,
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      `Transcription failed (${response.status}): ${detail.slice(0, 300)}`,
    );
  }

  const data = await response.json();
  const alternative = data?.results?.channels?.[0]?.alternatives?.[0];
  const text: string = alternative?.transcript ?? "";
  const durationSeconds: number = data?.metadata?.duration ?? 0;

  if (!text.trim()) {
    throw new Error("No speech was detected in that recording.");
  }

  return { text: text.trim(), durationSeconds };
}
