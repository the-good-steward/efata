import { Mark } from "@/components/logo";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-20">
      <div className="reveal flex max-w-lg flex-col items-center text-center">
        <span className="text-ash font-body text-xs tracking-[0.3em] uppercase">
          In development
        </span>

        <Mark size={64} className="text-parchment mt-10" />

        <h1 className="text-parchment font-display mt-8 text-6xl tracking-tight sm:text-7xl">
          efata
        </h1>

        <p className="text-ash font-display mt-5 text-lg italic">
          Ephphatha, &ldquo;be opened&rdquo;
        </p>

        <p className="text-parchment/80 font-body mt-10 max-w-sm text-base leading-relaxed text-balance">
          Practice the conversations that win the client, the interview, the
          offer, and hear exactly how you come across.
        </p>
      </div>

      <div className="bg-rule absolute bottom-8 h-px w-10" />
    </main>
  );
}
