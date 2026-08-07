// Overlay, not a screen. One sentence about what one word does.
export default function HedgeSheet({ word, note, onClose }: { word: string; note?: string; onClose?: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-end bg-scrim md:items-center md:justify-center">
      <div className="flex flex-col gap-4 rounded-t-[22px] bg-card px-6 pb-10 pt-7 md:w-[560px] md:rounded-[22px] md:p-8">
        <div className="font-serif text-[24px] text-clay md:text-[28px]">{word.trim()}</div>
        <p className="text-[17px] leading-[1.65] text-ink text-pretty md:text-[18px]">
          {note ?? "A softener. It moves the decision away from you."}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 self-start rounded-full border border-edge px-6 py-3 text-[16px] text-ink-2"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
