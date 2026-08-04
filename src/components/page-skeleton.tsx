import { Mark } from "@/components/logo";

/**
 * Shown instantly while a page's data is fetched.
 *
 * Every one of these pages reads from the database before it can
 * render, so without this a tap on the navigation did nothing visible
 * for a second or more and felt broken. The route change is instant;
 * only the data is not.
 */
export function PageSkeleton({ title }: { title?: string }) {
  return (
    <main className="flex flex-1 flex-col px-5 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="flex items-center justify-between">
          <Mark size={34} />
        </div>

        <div className="border-hairline mt-6 border-t pt-4">
          <div className="flex gap-6">
            {[64, 72, 118].map((w) => (
              <div
                key={w}
                className="bg-edge/40 h-4 animate-pulse rounded"
                style={{ width: w }}
              />
            ))}
          </div>
        </div>

        {title && <h1 className="ef-display text-paper mt-12">{title}</h1>}

        <div className="mt-8 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-raised h-16 animate-pulse rounded-[12px]"
              style={{ animationDelay: `${i * 120}ms` }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
