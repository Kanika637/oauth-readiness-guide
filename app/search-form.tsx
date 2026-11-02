"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const SUGGESTED_SEARCHES = ["Gmail", "Notion", "LinkedIn"] as const;

export function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function goToResearch(value: string) {
    const nextQuery = value.trim();
    if (!nextQuery) {
      return;
    }

    router.push(`/research?q=${encodeURIComponent(nextQuery)}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    goToResearch(query);
  }

  return (
    <div className="w-full">
      <form
        action="/research"
        method="get"
        onSubmit={handleSubmit}
        className="flex w-full min-w-0 flex-col gap-3 sm:flex-row"
      >
        <div className="min-w-0 flex-1">
          <label
            htmlFor="app-search"
            className="mb-2 block text-sm font-medium text-neutral-800"
          >
            Application name or website
          </label>
          <input
            id="app-search"
            name="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search an app (e.g. Gmail, Notion, Slack)..."
            autoComplete="off"
            enterKeyHint="search"
            className="h-12 w-full min-w-0 rounded-lg border border-neutral-300 bg-white px-4 text-base text-neutral-950 shadow-sm placeholder:text-neutral-400"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-neutral-950 px-5 text-sm font-medium text-white sm:mt-7"
        >
          Research app
        </button>
      </form>

      <p className="mt-4 text-sm text-neutral-600">Suggested searches</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SUGGESTED_SEARCHES.map((suggestion) => (
          <Link
            key={suggestion}
            href={`/research?q=${encodeURIComponent(suggestion)}`}
            className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-800 hover:border-neutral-400 hover:bg-neutral-50"
          >
            {suggestion}
          </Link>
        ))}
      </div>
    </div>
  );
}
