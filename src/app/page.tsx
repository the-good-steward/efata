function Flourish({ className = "" }: { className?: string }) {
  return (
    <svg
      width="120"
      height="16"
      viewBox="0 0 120 16"
      fill="none"
      className={`text-gold ${className}`}
      aria-hidden="true"
    >
      <path
        d="M4 14C20 4 100 4 116 14"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center px-6 py-20">
      <div className="reveal flex max-w-lg flex-col items-center text-center">
        <span className="text-ash font-body text-xs tracking-[0.3em] uppercase">
          In development
        </span>

        <Flourish className="mt-8" />

        <h1 className="text-parchment font-display mt-6 text-6xl sm:text-7xl">
          Efata
        </h1>

        <Flourish className="mt-6 rotate-180" />

        <p className="text-ash font-display mt-6 text-lg italic">
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
