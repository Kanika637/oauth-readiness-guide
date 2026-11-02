
import { Suspense } from "react";
import ResearchClient from "./ResearchClient";

type Props = {
  searchParams: Promise<{ q?: string | string[] }>;
};

export default function ResearchPage({ searchParams }: Props) {
  return (
    <main className="min-h-screen bg-neutral-50">
      <Suspense
        fallback={
          <div className="p-10 text-neutral-600">
            Loading research...
          </div>
        }
      >
        <ResearchContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function ResearchContent({ searchParams }: Props) {
  const params = await searchParams;
  const rawQuery = params.q;
  const query = (
    Array.isArray(rawQuery) ? rawQuery[0] : rawQuery
  )?.trim() ?? "";

  if (!query) {
    return <div className="p-10">No application provided.</div>;
  }

  return <ResearchClient query={query} />;
}
