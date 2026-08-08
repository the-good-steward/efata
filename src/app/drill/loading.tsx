import { Mark } from "@/components/logo";

/**
 * Shown the instant the drill is tapped.
 *
 * The page reads three tables before it can render, so without this a
 * tap on the floating button did nothing visible for a second. The
 * route change is immediate; only the data is not.
 */
export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-5 py-5">
        <Mark size={30} />
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-5">
        <div className="bg-card h-28 animate-pulse rounded-[16px]" />
        <div className="bg-card mt-10 h-6 w-32 animate-pulse rounded" />
        <div className="bg-card mt-4 h-10 w-full animate-pulse rounded" />
        <div className="bg-card mt-6 h-40 w-full animate-pulse rounded-[16px]" />
      </main>
    </div>
  );
}
