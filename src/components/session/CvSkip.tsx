// Screen 5 of 16. Names exactly what is lost, then gets out of the way.
import { Screen, Rule, Primary, Quiet } from "./Chrome";

export default function CvSkip({ onContinue, onReconsider }: { onContinue?: () => void; onReconsider?: () => void }) {
  return (
    <Screen
      footer={
        <div className="flex flex-col gap-3">
          <Primary label="Carry on" onClick={onContinue} />
          <Quiet label="Actually, let me add it" onClick={onReconsider} />
        </div>
      }
    >
      <h1 className="font-serif text-[31px] leading-[1.32] text-pretty md:text-[42px]">
        That&rsquo;s fine. Most people don&rsquo;t have it to hand.
      </h1>
      <p className="max-w-[62ch] text-[17px] leading-[1.7] text-ink-2 text-pretty md:text-[19px]">
        Everything works without it. You still get four questions built from
        the job post, and the same feedback on how you came across.
      </p>

      <Rule />

      <p className="text-[16px] leading-[1.7] text-ink-3 md:text-[17px]">
        Two things are different with a CV. Half your questions come from work
        you have actually done, so you have somewhere real to answer from. And
        when you leave out experience you already have, Efata can point back at
        it.
      </p>

      <p className="text-[16px] leading-[1.7] text-ink-3 md:text-[17px]">
        Add it any time from My profile. We won&rsquo;t ask again.
      </p>
    </Screen>
  );
}
