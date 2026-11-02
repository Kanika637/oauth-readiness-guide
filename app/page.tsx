import Link from "next/link";
import { SearchForm } from "./search-form";

const GUIDES = [
  {
    name: "Slack",
    initials: "S",
    href: "/research?q=Slack",
    summary:
      "Preview documented OAuth setup, common scopes, and workspace-level considerations before you start building.",
    setup: "Typically straightforward",
  },
  {
    name: "Gmail",
    initials: "G",
    href: "/research?q=Gmail",
    summary:
      "Review Google’s documented OAuth requirements, verification notes, and scope-sensitive access for Gmail APIs.",
    setup: "Additional verification may apply",
  },
  {
    name: "LinkedIn",
    initials: "in",
    href: "/research?q=LinkedIn",
    summary:
      "See how LinkedIn’s documented products, permissions, and application review can vary by requested access.",
    setup: "Access depends on the product",
  },
] as const;

const EVIDENCE_LABELS = [
  {
    label: "Tested",
    meaning: "Directly attempted and observed.",
  },
  {
    label: "Documented",
    meaning: "Supported by referenced documentation.",
  },
  {
    label: "Unknown",
    meaning: "Not yet verified.",
  },
] as const;

export default function Home() {
  return (
    <div className="overflow-x-hidden bg-neutral-50 text-neutral-950">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              OAuth Atlas
            </p>
            <p className="truncate text-xs text-neutral-500">
              Integration intelligence
            </p>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-6 sm:flex">
            <a
              href="#guides"
              className="text-sm text-neutral-700 hover:text-neutral-950"
            >
              Explore guides
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-neutral-700 hover:text-neutral-950"
            >
              How it works
            </a>
          </nav>

          <p className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[11px] font-medium tracking-wide text-neutral-600 uppercase">
            Built for developers
          </p>
        </div>
        <div className="flex gap-4 overflow-x-auto border-t border-neutral-100 px-4 py-2 sm:hidden">
          <a href="#guides" className="shrink-0 text-sm text-neutral-700">
            Explore guides
          </a>
          <a href="#how-it-works" className="shrink-0 text-sm text-neutral-700">
            How it works
          </a>
        </div>
      </header>

      <main id="main">
        <section className="border-b border-neutral-200 bg-white">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:py-24">
            <div className="min-w-0">
              <p className="font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase">
                Know before you integrate
              </p>
              <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Know what it takes to integrate any app.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-neutral-600 sm:text-lg">
                Discover OAuth prerequisites, approval requirements, estimated
                timelines, and potential blockers before you invest engineering
                time. Search by application name or website to open a
                documentation-based preview.
              </p>
              <div className="mt-8 max-w-xl">
                <SearchForm />
              </div>
            </div>

            <aside className="min-w-0 self-end rounded-xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-sm font-medium text-neutral-900">
                What this preview covers
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-600">
                <li>Documented prerequisites and approval processes</li>
                <li>Qualitative timeline signals, not guarantees</li>
                <li>Likely blockers that depend on scopes and use case</li>
              </ul>
            </aside>
          </div>
        </section>

        <section
          aria-labelledby="trust-heading"
          className="border-b border-neutral-200"
        >
          <div className="mx-auto grid w-full max-w-6xl gap-px bg-neutral-200 px-0 sm:grid-cols-3">
            <h2 id="trust-heading" className="sr-only">
              How findings are sourced
            </h2>
            <TrustItem
              title="Official documentation"
              body="Guides start from publicly available provider docs, not unverified claims."
            />
            <TrustItem
              title="Evidence-backed findings"
              body="Each finding is meant to carry a source label so you can see what supports it."
            />
            <TrustItem
              title="Clear uncertainty labels"
              body="Gaps stay visible. Missing information is marked instead of filled in."
            />
          </div>
        </section>

        <section
          id="guides"
          aria-labelledby="guides-heading"
          className="scroll-mt-24 border-b border-neutral-200 bg-white"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <p className="font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase">
              Popular guides
            </p>
            <h2
              id="guides-heading"
              className="mt-3 text-2xl font-semibold tracking-tight"
            >
              Start with a documentation-based preview
            </h2>
            <p className="mt-3 max-w-2xl text-neutral-600">
              Requirements vary by requested scopes and use case. These cards
              describe what a guide covers; they are not test results and do not
              include precise approval timelines.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {GUIDES.map((guide) => (
                <article
                  key={guide.name}
                  className="flex min-w-0 flex-col rounded-xl border border-neutral-200 bg-neutral-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-sm font-semibold"
                      >
                        {guide.initials}
                      </span>
                      <h3 className="text-lg font-semibold">{guide.name}</h3>
                    </div>
                    <p className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-600">
                      Documentation-based preview
                    </p>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-neutral-600">
                    {guide.summary}
                  </p>
                  <p className="mt-4 text-sm font-medium text-neutral-900">
                    {guide.setup}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    Actual access depends on the scopes you request and your
                    intended use case.
                  </p>
                  <Link
                    href={guide.href}
                    className="mt-6 inline-flex text-sm font-medium text-neutral-950 underline decoration-neutral-300 underline-offset-4 hover:decoration-neutral-950"
                  >
                    Explore the {guide.name} guide
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          aria-labelledby="how-heading"
          className="scroll-mt-24 border-b border-neutral-200"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <p className="font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase">
              How it works
            </p>
            <h2
              id="how-heading"
              className="mt-3 text-2xl font-semibold tracking-tight"
            >
              A short path from search to next steps
            </h2>
            <ol className="mt-10 grid gap-4 md:grid-cols-3">
              <Step
                number="01"
                title="Search for an application"
                body="Enter an app name or website to open a placeholder research view for that query."
              />
              <Step
                number="02"
                title="Discover requirements and blockers"
                body="Review documented prerequisites, approval process notes, and likely blockers."
              />
              <Step
                number="03"
                title="Follow your next steps"
                body="Use the findings to decide whether to proceed, request access, or change scopes."
              />
            </ol>
          </div>
        </section>

        <section
          id="evidence"
          aria-labelledby="evidence-heading"
          className="scroll-mt-24 bg-white"
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <p className="font-mono text-xs tracking-[0.18em] text-neutral-500 uppercase">
              Evidence and transparency
            </p>
            <h2
              id="evidence-heading"
              className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight"
            >
              Every finding will be labelled. Estimates are not guarantees.
            </h2>
            <p className="mt-4 max-w-2xl text-neutral-600">
              OAuth Atlas is built to show the basis for each statement. Live
              research is not implemented yet; when findings ship, they will use
              these labels so you can weigh confidence yourself.
            </p>
            <dl className="mt-10 divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200">
              {EVIDENCE_LABELS.map((item) => (
                <div
                  key={item.label}
                  className="grid gap-2 bg-neutral-50 px-5 py-4 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-baseline"
                >
                  <dt className="font-mono text-sm font-semibold">
                    {item.label}
                  </dt>
                  <dd className="text-sm text-neutral-600">{item.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div className="min-w-0 max-w-sm">
            <p className="font-semibold">OAuth Atlas</p>
            <p className="mt-2 text-sm leading-6 text-neutral-600">
              A readiness guide for developers who need to understand OAuth
              access before they build an integration.
            </p>
          </div>
          <nav aria-label="Footer">
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#guides" className="text-neutral-700 hover:text-neutral-950">
                  Explore guides
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="text-neutral-700 hover:text-neutral-950"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="#evidence"
                  className="text-neutral-700 hover:text-neutral-950"
                >
                  Evidence and transparency
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function TrustItem({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-neutral-50 px-4 py-8 sm:px-6">
      <p className="text-sm font-semibold text-neutral-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{body}</p>
    </div>
  );
}

function Step({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <li className="min-w-0 rounded-xl border border-neutral-200 bg-white p-5">
      <p className="font-mono text-xs text-neutral-500">{number}</p>
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-neutral-600">{body}</p>
    </li>
  );
}
