
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Source = {
  id: string;
  title: string;
  url: string;
  hostname: string;
  sourceType: "official" | "third_party";
};

type EvidenceItem = {
  text: string;
  sourceIds: string[];
  evidenceType: "official_documentation" | "third_party_documentation" | "inference";
  confidence: "high" | "medium" | "low";
};

type ResearchResult = {
  guide: {
    appName: string;
    summary: string;
    difficulty: string;
    estimatedTime: string;
    timeEstimateReasoning: string;
    prerequisites: string[];
    steps: EvidenceItem[];
    commonBlockers: EvidenceItem[];
    agentCanDo: string[];
    developerMustDo: string[];
    confidenceNotes: string;
    validationChecklist: string[];
  };
  sources: Source[];
  composio: {
    checked: boolean;
    toolkitFound: boolean;
    toolkitSlug: string;
    toolkitName: string;
    managedOAuthAvailable: boolean | null;
    managedAuthSchemes: string[];
    explanation: string;
    docsUrl: string;
  };
  researchType: string;
  verifiedByHandsOnTest: boolean;
  generatedAt: string;
  fromCache?: boolean;
};

type Props = {
  query: string;
};

function EvidenceList({
  items,
  sources,
  numbered = false,
}: {
  items: EvidenceItem[];
  sources: Source[];
  numbered?: boolean;
}) {
  const Wrapper = numbered ? "ol" : "ul";

  return (
    <Wrapper className={numbered ? "mt-6 space-y-6" : "mt-4 space-y-4"}>
      {items.map((item, index) => (
        <li key={`${item.text}-${index}`} className="rounded-xl border p-5">
          <div className="flex gap-3">
            {numbered && (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                {index + 1}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="leading-7 text-gray-800">{item.text}</p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                  {item.evidenceType.replaceAll("_", " ")}
                </span>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                  {item.confidence} confidence
                </span>
              </div>

              {item.sourceIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.sourceIds.map((id) => {
                    const source = sources.find((s) => s.id === id);
                    if (!source) return null;

                    return (
                      <a
                        key={id}
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        [{id}] {source.hostname} ↗
                      </a>
                    );
                  })}
                </div>
              )}

              {item.sourceIds.length === 0 && (
                <p className="mt-3 text-xs text-amber-700">
                  No retrieved source was linked to this item. Verify before relying on it.
                </p>
              )}
            </div>
          </div>
        </li>
      ))}
    </Wrapper>
  );
}

export default function ResearchClient({ query }: Props) {
  const [data, setData] = useState<ResearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [partial, setPartial] = useState<Pick<ResearchResult, "sources" | "composio"> | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!query) return;

    let cancelled = false;

    async function fetchResearch() {
      setIsLoading(true);
      setFetchError("");
      setPartial(null);
      setData(null);

      try {
        const response = await fetch("/api/research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const result = await response.json();

        if (response.status === 429 && result.code === "AI_RATE_LIMITED") {
          if (!cancelled) setPartial(result.partial);
          return;
        }

        if (!response.ok) {
          throw new Error(result.error || "Unable to generate the research report.");
        }

        if (!result.guide || !result.composio) {
          throw new Error("The API returned an incomplete report. Please try again.");
        }

        if (!cancelled) setData(result as ResearchResult);
      } catch (error) {
        if (!cancelled) {
          setFetchError(
            error instanceof Error ? error.message : "Something went wrong. Please try again."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchResearch();

    return () => {
      cancelled = true;
    };
  }, [query, retryCount]);

  function handleRetry() {
    setRetryCount((count) => count + 1);
  }

  const loading = query ? isLoading : false;
  const error = query ? fetchError : "Please enter an app name to research.";

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-semibold tracking-widest text-blue-600">OAUTH ATLAS</p>
        <h1 className="mt-5 text-3xl font-bold">Researching {query}...</h1>
        <p className="mt-3 text-gray-600">
          Checking Composio support, searching developer documentation and preparing your guide.
        </p>
        <div className="mt-8 h-2 overflow-hidden rounded-full bg-gray-200">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-blue-600" />
        </div>
        <p className="mt-3 text-sm text-gray-500">
          New providers may take longer to research.
        </p>
      </main>
    );
  }

  if (partial) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-semibold tracking-widest text-blue-600">OAUTH ATLAS</p>
        <h1 className="mt-5 text-3xl font-bold">Our Gemini AI credits have run out.</h1>
        <p className="mt-4 text-lg text-gray-700">
          This project uses the free tier of Google Gemini to write the integration report, and
          its free usage quota has been reached. This is not a problem with your search or the app.
        </p>
        <ul className="mt-6 list-disc space-y-2 pl-6 text-gray-600">
          <li>Your search for &ldquo;{query}&rdquo; was found and researched successfully.</li>
          <li>Only the final AI report step was blocked (error 429: quota exceeded).</li>
          <li>The free quota resets periodically, so trying again later should work.</li>
        </ul>

        <section className="mt-10 rounded-xl border p-5">
          <h2 className="text-lg font-semibold">What we could still find</h2>
          <p className="mt-3 text-sm text-gray-700">
            {partial.composio.toolkitFound
              ? `Composio supports ${partial.composio.toolkitName}. ${partial.composio.explanation}`
              : partial.composio.explanation || "No Composio toolkit information was available."}
          </p>
          <h3 className="mt-5 text-sm font-semibold text-gray-700">Documentation found</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {partial.sources.map((source) => (
              <li key={source.id}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {source.title} ↗
                </a>
                <span className="ml-2 text-gray-500">{source.hostname}</span>
              </li>
            ))}
          </ul>
        </section>
        <button
          onClick={handleRetry}
          className="mt-8 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          Try again
        </button>
        <div className="mt-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <p className="text-sm font-semibold tracking-widest text-blue-600">OAUTH ATLAS</p>
        <h1 className="mt-5 text-3xl font-bold">We couldn&apos;t complete your research.</h1>
        <p className="mt-4 text-red-600">
          {error}
        </p>
        <button
          onClick={handleRetry}
          className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          Try again
        </button>
        <div className="mt-6">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to home
          </Link>
        </div>
      </main>
    );
  }

  const { guide, sources, composio } = data;

  const difficultyColor = guide.difficulty.toLowerCase().includes("easy")
    ? "bg-green-100 text-green-800"
    : guide.difficulty.toLowerCase().includes("hard")
      ? "bg-red-100 text-red-800"
      : "bg-yellow-100 text-yellow-800";

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Back to home
      </Link>

      <header className="mt-8 border-b pb-8">
        <p className="text-sm font-semibold tracking-widest text-blue-600">
          OAUTH ATLAS · INTEGRATION READINESS
        </p>
        <h1 className="mt-4 text-4xl font-bold">{guide.appName}</h1>
        <p className="mt-4 text-lg leading-8 text-gray-600">{guide.summary}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <span className={`rounded-full px-4 py-2 text-sm font-medium ${difficultyColor}`}>
            Difficulty: {guide.difficulty}
          </span>
          <span className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700">
            Developer effort: {guide.estimatedTime}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
            Documentation-based research
          </span>
          <span>Not hands-on tested</span>
          {data.fromCache && <span>Loaded from saved research</span>}
        </div>
      </header>

      <section className="mt-10 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">1. Composio compatibility</h2>

        {!composio.checked && (
          <div className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            Composio lookup was not performed. Add COMPOSIO_API_KEY to the server environment
            to check the live toolkit catalogue.
          </div>
        )}

        {composio.checked && !composio.toolkitFound && (
          <div className="mt-4 rounded-lg bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">Toolkit not found by this lookup</p>
            <p className="mt-2 text-sm text-amber-800">{composio.explanation}</p>
          </div>
        )}

        {composio.toolkitFound && (
          <div className="mt-4">
            <p className="text-sm text-gray-500">Composio toolkit</p>
            <p className="mt-1 text-lg font-semibold">{composio.toolkitName}</p>

            <div className="mt-4">
              {composio.managedOAuthAvailable ? (
                <span className="rounded-full bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
                  Managed OAuth scheme found
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800">
                  No managed OAuth scheme found
                </span>
              )}
            </div>

            {composio.managedAuthSchemes.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700">Returned auth schemes</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {composio.managedAuthSchemes.map((scheme, index) => (
                    <span key={`${scheme}-${index}`} className="rounded bg-gray-100 px-3 py-1 text-xs">
                      {scheme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-4 text-sm leading-6 text-gray-600">{composio.explanation}</p>
            <a
              href={composio.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-blue-600 hover:underline"
            >
              View toolkit details ↗
            </a>
          </div>
        )}

        <p className="mt-5 text-xs leading-5 text-gray-500">
          This checks whether Composio returned a managed OAuth scheme for the toolkit.
          It does not test an actual user connection or guarantee that every OAuth method
          and scope is supported.
        </p>
      </section>

      <section className="mt-10 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">2. Estimated implementation effort</h2>
        <p className="mt-3 text-2xl font-bold">{guide.estimatedTime}</p>
        <p className="mt-3 leading-7 text-gray-600">{guide.timeEstimateReasoning}</p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">3. Prerequisites</h2>
        <ul className="mt-4 list-disc space-y-3 pl-6 text-gray-700">
          {guide.prerequisites.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">4. Integration steps</h2>
        <EvidenceList items={guide.steps} sources={sources} numbered />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">5. Common blockers</h2>
        <EvidenceList items={guide.commonBlockers} sources={sources} />
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-semibold text-green-900">What an AI agent can do</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-gray-700">
            {guide.agentCanDo.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>

        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">
          <h2 className="text-xl font-semibold text-orange-900">What the developer must do</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-gray-700">
            {guide.developerMustDo.map((item, index) => <li key={index}>{item}</li>)}
          </ul>
        </div>
      </section>

      <section className="mt-12 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">6. Validate the integration</h2>
        <p className="mt-2 text-sm text-gray-500">
          These are suggested checks for a real setup. OAuth Atlas has not performed them.
        </p>
        <ul className="mt-4 list-disc space-y-3 pl-6 text-gray-700">
          {guide.validationChecklist.map((item, index) => <li key={index}>{item}</li>)}
        </ul>
      </section>

      <section className="mt-12 rounded-xl border p-6">
        <h2 className="text-xl font-semibold">7. Confidence and limitations</h2>
        <p className="mt-3 leading-7 text-gray-700">{guide.confidenceNotes}</p>
        <p className="mt-4 text-sm text-gray-500">
          This report is based on retrieved documentation and a Composio toolkit lookup.
          It has not been independently validated through a completed live OAuth integration.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Research sources</h2>
        <p className="mt-2 text-sm text-gray-500">
          Sources retrieved for this report. Source labels are heuristic classifications;
          check the linked page before relying on a claim.
        </p>

        <ul className="mt-5 space-y-4">
          {sources.map((source) => (
            <li key={source.id} className="border-b pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold">
                  {source.id}
                </span>
                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  {source.sourceType === "official" ? "Likely official" : "Third party"}
                </span>
              </div>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-medium text-blue-600 hover:underline"
              >
                {source.title} ↗
              </a>
              <p className="mt-1 text-xs text-gray-500">{source.hostname}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Research another app
        </Link>
        <button
          onClick={handleRetry}
          className="rounded-lg border px-5 py-3 text-sm font-medium hover:bg-gray-50"
        >
          Research again
        </button>
      </footer>
    </main>
  );
}
