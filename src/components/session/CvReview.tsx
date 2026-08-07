// Screen 4 of 16. What was read from the CV, so it can be checked and corrected.
import { Screen, Eyebrow, Primary, Quiet } from "./Chrome";

export interface CvSummary {
  name: string;
  headline: string;
  tools: string[];
}

export default function CvReview({
  cv,
  onConfirm,
  onEdit,
  onReplace,
}: {
  cv: CvSummary;
  onConfirm?: () => void;
  onEdit?: () => void;
  onReplace?: () => void;
}) {
  return (
    <Screen
      header={
        <div className="px-6 pt-7 text-center md:px-10">
          <Eyebrow>Read from your CV</Eyebrow>
        </div>
      }
      footer={
        <div className="flex flex-col gap-3">
          <Primary label="This is right" onClick={onConfirm} />
          <Quiet label="Something's missing — edit it" onClick={onEdit} />
        </div>
      }
    >
      <h1 className="font-serif text-[27px] leading-[1.35] text-pretty md:text-[38px]">
        Check this is right before we use it.
      </h1>

      <div className="flex flex-col gap-3.5 rounded-2xl bg-card p-5 md:p-6">
        <div className="flex items-baseline justify-between">
          <div className="text-[17px] font-semibold md:text-[19px]">{cv.name}</div>
          <button type="button" onClick={onReplace} className="min-h-11 text-[15px] text-sea">
            Replace
          </button>
        </div>
        <div className="text-[16px] leading-relaxed text-ink-2 md:text-[17px]">{cv.headline}</div>
        <div className="h-px bg-hairline" />
        <div className="text-[12px] uppercase tracking-[0.14em] text-ink-3">Tools it lists</div>
        <div className="flex flex-wrap gap-2">
          {cv.tools.map((t) => (
            <span key={t} className="rounded-full border border-edge px-3.5 py-2.5 text-[15px] text-ink">
              {t}
            </span>
          ))}
        </div>
      </div>

      <p className="max-w-[66ch] text-[15px] leading-relaxed text-ink-3 text-pretty">
        Anything wrong or missing here would be worth fixing now — we only ever point at what is on this list.
      </p>
    </Screen>
  );
}
