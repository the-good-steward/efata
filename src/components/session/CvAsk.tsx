// Screen 3 of 16. One-time. Leads with the reason, not the file input.
import { Screen, Eyebrow, Rule, Primary, Quiet } from "./Chrome";

export default function CvAsk({
  onChooseFile,
  onSkip,
}: {
  onChooseFile?: () => void;
  onSkip?: () => void;
}) {
  return (
    <Screen
      footer={
        <div className="flex flex-col gap-3">
          <Primary label="Choose a file" onClick={onChooseFile} />
          <Quiet label="I don't have one to hand" onClick={onSkip} />
        </div>
      }
    >
      <Eyebrow tone="quiet">Upload your CV</Eyebrow>

      <h1 className="font-serif text-[31px] leading-[1.32] text-pretty md:text-[44px]">
        Most people undersell what they have already done.
      </h1>

      <p className="max-w-[60ch] text-[17px] leading-[1.7] text-ink-2 text-pretty md:text-[19px]">
        With one, half your questions come from work you have actually done.
      </p>

      <Rule />

      <p className="text-[16px] leading-[1.7] text-ink-3 md:text-[17px]">
        A PDF or a screenshot. Nobody else reads it, and we do not keep your
        phone number or address.
      </p>
    </Screen>
  );
}
