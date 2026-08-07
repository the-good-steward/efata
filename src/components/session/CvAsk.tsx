// Screen 3 of 16. One-time. Leads with the reason, not the file input.
import { Screen, Eyebrow, Rule, Primary, Secondary, Quiet } from "./Chrome";

export default function CvAsk({
  onChooseFile,
  onTakePhoto,
  onSkip,
}: {
  onChooseFile?: () => void;
  onTakePhoto?: () => void;
  onSkip?: () => void;
}) {
  return (
    <Screen
      header={
        <div className="px-6 pt-7 text-center md:px-10">
          <Eyebrow tone="quiet">Once, then never again</Eyebrow>
        </div>
      }
      footer={
        <div className="flex flex-col gap-3">
          <Primary label="Choose a file" onClick={onChooseFile} />
          <Secondary label="Take a photo of it" onClick={onTakePhoto} />
          <Quiet label="I don't have one to hand" onClick={onSkip} />
        </div>
      }
    >
      <h1 className="font-serif text-[31px] leading-[1.32] text-pretty md:text-[44px]">
        Most people undersell what they have already done.
      </h1>
      <p className="max-w-[60ch] text-[17px] leading-[1.7] text-ink-2 text-pretty md:text-[19px]">
        Add your CV and we can point back at your own experience on the days you leave it out of an answer.
      </p>
      <Rule />
      <p className="text-[16px] leading-[1.7] text-ink-3 md:text-[17px]">
        It stays on your device. Nobody else reads it.
      </p>
    </Screen>
  );
}
