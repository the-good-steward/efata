// Screen 16 of 16. One habit named across the whole session. No score.
import { Screen, Rule, Primary, Quiet } from "./Chrome";

export default function SessionVerdict({
  questionCount,
  headline,
  body,
  softenersBefore,
  softenersAfter,
  onLogInterview,
  onBackToPractice,
}: {
  questionCount: number;
  headline: string;
  body: string;
  softenersBefore: number;
  softenersAfter: number;
  onLogInterview?: () => void;
  onBackToPractice?: () => void;
}) {
  return (
    <Screen
      footer={
        <div className="flex flex-col gap-3">
          <Primary label="Log a real interview" onClick={onLogInterview} />
          <Quiet label="Back to practice" onClick={onBackToPractice} />
        </div>
      }
    >
      <svg width="44" height="34" viewBox="0 0 130 100" aria-label="Efata" role="img">
        <g fill="none" stroke="var(--color-ink)" strokeWidth="10" strokeLinecap="round">
          <path d="M10,78 C36,22 74,20 96,42" />
          <path d="M10,22 C36,78 74,80 96,58" />
        </g>
        <circle cx="112" cy="50" r="7" fill="var(--color-sea)" />
      </svg>
      <h1 className="font-serif text-[30px] leading-[1.35] text-pretty md:text-[42px]">{headline}</h1>
      <p className="max-w-[62ch] text-[17px] leading-[1.7] text-ink-2 text-pretty md:text-[19px]">{body}</p>
      <Rule />
      <p className="text-[16px] leading-[1.7] text-ink-3 md:text-[17px]">
        {softenersBefore} softeners across the first attempts, {softenersAfter} across the retries. {questionCount}{" "}
        questions.
      </p>
    </Screen>
  );
}
