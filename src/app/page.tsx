import { Mark } from "@/components/logo";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-20">
      <div className="reveal flex max-w-lg flex-col items-center text-center">
        <span className="text-ash font-body text-[13px] font-semibold tracking-[0.18em] uppercase">
          In development
        </span>

        <Mark size={104} className="mt-12" />

        <h1
          className="text-parchment font-display mt-10 text-[40px] leading-[44px]"
          style={{ fontWeight: 600 }}
        >
          efata
        </h1>

        <p className="text-ash font-display mt-4 text-lg italic">
          Ephphatha, &ldquo;be opened&rdquo;
        </p>

        <p className="text-parchment/85 font-body mt-10 max-w-sm text-balance">
          Open the mouth, and the coin is already there.
        </p>

        <p className="text-ash font-body mt-6 max-w-sm text-[15px] leading-relaxed text-balance">
          Practice the conversations that win the client, the interview, the
          offer, and hear exactly how you come across.
        </p>
      </div>
    </main>
  );
}
