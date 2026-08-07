import Question from "@/components/session/Question";
import HeldBreath from "@/components/session/HeldBreath";
import Recording from "@/components/session/Recording";
import WhatItCostYou from "@/components/session/WhatItCostYou";
import YoursSaidStraight from "@/components/session/YoursSaidStraight";

/**
 * A harness for the design screens, before they are wired to real data.
 *
 * Not linked from anywhere and not for users. It exists so the screens
 * can be seen on a phone with real copy at real length, which is the
 * only way to find out whether "nothing scrolls" survives contact with
 * an actual question.
 */
export const metadata = { title: "Design check" };

const QUESTION =
  "What's your rate for this scope, and how did you arrive at it?";

export default function DesignCheck() {
  return (
    <div className="flex flex-col">
      <div className="h-dvh">
        <Question
          index={1}
          total={3}
          category="Situational"
          question={QUESTION}
          why="They're checking whether you can defend a number without apologising for it."
        />
      </div>
      <div className="relative h-dvh">
        <HeldBreath question={QUESTION} />
      </div>
      <div className="h-dvh">
        <Recording question={QUESTION} elapsedSeconds={47} />
      </div>
      <div className="h-dvh">
        <WhatItCostYou
          index={1}
          total={3}
          read="You knew your number and then took it back three times in one breath. Say the figure, then stop talking."
          fillerCount={9}
          wpm={168}
          nextLabel="Say it again"
        />
      </div>
      <div className="h-dvh">
        <YoursSaidStraight
          index={1}
          total={3}
          rewrite="My rate for this scope is twenty-two an hour, based on the turnaround you need."
          playing={false}
          isLastQuestion={false}
        />
      </div>
    </div>
  );
}
