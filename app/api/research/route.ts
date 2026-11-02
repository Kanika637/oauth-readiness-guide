
import { NextRequest, NextResponse } from "next/server";

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
};

type Source = {
  id: string;
  title: string;
  url: string;
  hostname: string;
  sourceType: "official" | "third_party";
};

type EvidenceStep = {
  text: string;
  sourceIds: string[];
  evidenceType: "official_documentation" | "third_party_documentation" | "inference";
  confidence: "high" | "medium" | "low";
};

type ResearchGuide = {
  appName: string;
  summary: string;
  difficulty: string;
  estimatedTime: string;
  timeEstimateReasoning: string;
  prerequisites: string[];
  steps: EvidenceStep[];
  commonBlockers: EvidenceStep[];
  agentCanDo: string[];
  developerMustDo: string[];
  confidenceNotes: string;
  validationChecklist: string[];
};

type ComposioStatus = {
  checked: boolean;
  toolkitFound: boolean;
  toolkitSlug: string;
  toolkitName: string;
  managedOAuthAvailable: boolean | null;
  managedAuthSchemes: string[];
  explanation: string;
  docsUrl: string;
};

type ResearchResponse = {
  guide: ResearchGuide;
  sources: Source[];
  composio: ComposioStatus;
  researchType: string;
  verifiedByHandsOnTest: boolean;
  generatedAt: string;
  fromCache?: boolean;
};

const cache = new Map<string, { data: ResearchResponse; time: number }>();
const inFlight = new Map<string, Promise<ResearchResponse>>();
const CACHE_DURATION = 1000 * 60 * 60 * 12;
const MAX_CACHE_ENTRIES = 100;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function isOfficialSource(url: string, appName: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const app = appName.toLowerCase().replace(/[^a-z0-9]/g, "");

    const knownOfficialHosts = [
      "developers.google.com",
      "developer.google.com",
      "developers.facebook.com",
      "learn.microsoft.com",
      "login.microsoftonline.com",
      "api.slack.com",
      "docs.slack.dev",
      "developers.notion.com",
      "developers.hubspot.com",
      "developer.atlassian.com",
      "docs.github.com",
      "developer.linkedin.com",
      "learn.microsoft.com",
      "developers.zoho.com",
      "api.tavily.com",
    ];

    if (knownOfficialHosts.some((domain) => host === domain || host.endsWith(`.${domain}`))) {
      return true;
    }

    const hostWithoutWww = host.replace(/^www\./, "");
    const appHostMatch =
      hostWithoutWww.startsWith(`${app}.`) ||
      hostWithoutWww === `${app}.com` ||
      hostWithoutWww.includes(`${app}.com`);

    const developerHost =
      host.includes("developer") ||
      host.includes("developers") ||
      host.includes("docs.");

    return appHostMatch && developerHost;
  } catch {
    return false;
  }
}

function cleanSources(results: TavilyResult[], appName: string): Source[] {
  const unique = new Map<string, Source>();

  for (const result of results) {
    if (!result.url) continue;

    try {
      const parsed = new URL(result.url);

      if (!["http:", "https:"].includes(parsed.protocol)) continue;

      const url = parsed.href;
      if (unique.has(url)) continue;

      const hostname = parsed.hostname.replace(/^www\./, "");

      unique.set(url, {
        id: "",
        title: result.title || hostname,
        url,
        hostname,
        sourceType: isOfficialSource(url, appName) ? "official" : "third_party",
      });
    } catch {
      continue;
    }
  }

  const sorted = [...unique.values()].sort(
    (a, b) => Number(b.sourceType === "official") - Number(a.sourceType === "official")
  );

  return sorted.slice(0, 8).map((source, index) => ({
    ...source,
    id: `S${index + 1}`,
  }));
}

type ComposioPayload = {
  composio_managed_auth_schemes?: unknown;
  data?: { composio_managed_auth_schemes?: unknown };
  toolkit?: { composio_managed_auth_schemes?: unknown };
};

function extractManagedSchemes(data: ComposioPayload | null | undefined): string[] {
  const raw: unknown =
    data?.composio_managed_auth_schemes ??
    data?.data?.composio_managed_auth_schemes ??
    data?.toolkit?.composio_managed_auth_schemes ??
    [];

  if (!Array.isArray(raw)) return [];

  return raw.map((item: unknown) => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object") {
      const obj = item as Record<string, unknown>;
      return String(
        obj.auth_scheme || obj.authScheme || obj.type || obj.name || JSON.stringify(obj)
      );
    }
    return String(item);
  });
}

async function lookupComposio(appName: string): Promise<ComposioStatus> {
  const apiKey = process.env.COMPOSIO_API_KEY;
  const toolkitSlug = slugify(appName);

  const fallback: ComposioStatus = {
    checked: false,
    toolkitFound: false,
    toolkitSlug,
    toolkitName: appName,
    managedOAuthAvailable: null,
    managedAuthSchemes: [],
    explanation: "Composio lookup was not performed. Add COMPOSIO_API_KEY to enable this check.",
    docsUrl: "https://docs.composio.dev/toolkits/managed-auth",
  };

  if (!apiKey) return fallback;

  const response = await fetch(
    `https://backend.composio.dev/api/v3.1/toolkits/${encodeURIComponent(toolkitSlug)}`,
    {
      method: "GET",
      headers: { "x-api-key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    }
  );

  if (response.status === 404) {
    return {
      ...fallback,
      checked: true,
      explanation:
        "This exact toolkit slug was not found in the Composio API. The provider may use a different toolkit name, may not be available in Composio, or may need a different slug.",
    };
  }

  if (!response.ok) {
    throw new Error(`Composio toolkit lookup failed (${response.status}). Check your API key and try again.`);
  }

  const data = await response.json();
  const schemes = extractManagedSchemes(data);

  const managedOAuthAvailable = schemes.some((scheme) =>
    /oauth/i.test(scheme)
  );

  const toolkitName =
    data?.name ||
    data?.display_name ||
    data?.slug ||
    data?.toolkit?.name ||
    appName;

  return {
    checked: true,
    toolkitFound: true,
    toolkitSlug,
    toolkitName: String(toolkitName),
    managedOAuthAvailable,
    managedAuthSchemes: schemes,
    explanation: managedOAuthAvailable
      ? "Composio's toolkit response lists a managed OAuth scheme. A developer can generally start with Composio-managed authentication, subject to the toolkit's supported methods and scopes."
      : "The toolkit was found, but its response did not list a managed OAuth scheme. The developer should check the toolkit's supported auth methods and may need to provide their own OAuth app or credentials.",
    docsUrl: `https://composio.dev/toolkits/${toolkitSlug}`,
  };
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => typeof item === "string" && item.trim())
    .map((item) => item.trim())
    .slice(0, 12);
}

function safeEvidenceItems(
  value: unknown,
  sources: Source[]
): EvidenceStep[] {
  if (!Array.isArray(value)) return [];

  const validIds = new Set(sources.map((source) => source.id));

  return value
    .filter((item) => item && typeof item.text === "string" && item.text.trim())
    .slice(0, 12)
    .map((item) => {
      const sourceIds = Array.isArray(item.sourceIds)
        ? item.sourceIds.filter(
            (id: unknown) => typeof id === "string" && validIds.has(id)
          )
        : [];

      const evidenceType = [
        "official_documentation",
        "third_party_documentation",
        "inference",
      ].includes(item.evidenceType)
        ? item.evidenceType
        : "inference";

      const confidence = ["high", "medium", "low"].includes(item.confidence)
        ? item.confidence
        : "low";

      return {
        text: item.text.trim(),
        sourceIds,
        evidenceType,
        confidence,
      };
    });
}

function parseGeminiJson(text: string, sources: Source[]): ResearchGuide {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const parsed = JSON.parse(cleaned);

  return {
    appName: String(parsed.appName || "Unknown app"),
    summary: String(parsed.summary || "No summary available."),
    difficulty: String(parsed.difficulty || "Unknown"),
    estimatedTime: String(parsed.estimatedTime || "Unknown"),
    timeEstimateReasoning: String(
      parsed.timeEstimateReasoning || "The available evidence is not sufficient for a reliable estimate."
    ),
    prerequisites: safeStringArray(parsed.prerequisites),
    steps: safeEvidenceItems(parsed.steps, sources),
    commonBlockers: safeEvidenceItems(parsed.commonBlockers, sources),
    agentCanDo: safeStringArray(parsed.agentCanDo),
    developerMustDo: safeStringArray(parsed.developerMustDo),
    confidenceNotes: String(
      parsed.confidenceNotes || "Some details require independent verification."
    ),
    validationChecklist: safeStringArray(parsed.validationChecklist),
  };
}

async function generateResearch(appName: string): Promise<ResearchResponse> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const geminiModel = process.env.GEMINI_MODEL || "gemini-3.8-flash";

  if (!tavilyKey || !geminiKey) {
    throw new Error("Missing TAVILY_API_KEY or GEMINI_API_KEY in environment variables.");
  }

  // Run Composio lookup and web research at the same time.
  const [composioResult, tavilyResponse] = await Promise.all([
    lookupComposio(appName),
    fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: `${appName} official developer documentation OAuth 2.0 authorization code redirect URI scopes app registration`,
        search_depth: "basic",
        max_results: 8,
        include_answer: false,
        include_raw_content: false,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    }),
  ]);

  if (!tavilyResponse.ok) {
    throw new Error(`Web research failed (${tavilyResponse.status}). Please try again.`);
  }

  const tavilyData = await tavilyResponse.json();
  const results: TavilyResult[] = tavilyData.results || [];

  if (results.length === 0) {
    throw new Error("No useful documentation was found. Try the provider's official product name.");
  }

  const sources = cleanSources(results, appName);

  const researchContext = results
    .map((result) => {
      const source = sources.find((item) => item.url === result.url);
      if (!source) return "";

      return `SOURCE ID: ${source.id}
Title: ${source.title}
URL: ${source.url}
Source classification: ${source.sourceType}
Content: ${(result.content || "").slice(0, 3500)}`;
    })
    .filter(Boolean)
    .join("\n\n");

  const composioContext = JSON.stringify(composioResult, null, 2);

  const prompt = `
You are OAuth Atlas, an OAuth integration readiness assistant for individual developers.

The user wants to connect their own application to ${appName}.
They are not necessarily building a commercial integration for thousands of users.

COMPOSIO TOOLKIT LOOKUP:
${composioContext}

IMPORTANT COMPOSIO RULES:
- Treat the Composio API result as the source of truth for whether the exact toolkit was found and whether a managed OAuth scheme was returned.
- Do not claim a toolkit exists if toolkitFound is false.
- Do not claim managed OAuth is available if managedOAuthAvailable is false or null.
- A toolkit may support multiple auth methods. Explain that the developer should inspect the specific OAuth scheme and required scopes.
- Composio-managed OAuth means Composio maintains the OAuth app credentials and redirect URI. The end user still authorizes their provider account.
- If managed OAuth is unavailable, explain the bring-your-own-app path only as far as supported by evidence.
- Do not confuse Composio toolkit availability with the provider's own OAuth availability.

WEB RESEARCH:
${researchContext}

RESEARCH RULES:
- Prioritise official provider developer documentation.
- Use only the supplied sources. Do not invent URLs, scopes, endpoints, approval requirements, pricing, or capabilities.
- Every actionable integration step and blocker must include sourceIds from the supplied source IDs.
- If a statement is an inference, label evidenceType as "inference" and use low or medium confidence.
- If no source supports a claim, do not present it as a confirmed fact.
- Use "Unknown" when the evidence is insufficient.
- Never claim hands-on testing. OAuth Atlas has NOT completed a live OAuth flow.
- Separate active developer effort from external approval or waiting time.
- Mention scopes only when the supplied sources support them.
- Explain what the developer needs to do in Composio versus at the provider.
- Distinguish actions an AI coding agent can prepare from actions requiring human access, decisions, credentials or approval.
- Do not include duplicate step numbers in the text.
- Keep the guide concise and practical.

Return ONLY valid JSON, no Markdown fences, with this exact structure:
{
  "appName": "Provider name",
  "summary": "Short explanation of the integration and the Composio context",
  "difficulty": "Easy, Medium, or Hard — with a short reason",
  "estimatedTime": "Active developer effort range or Unknown",
  "timeEstimateReasoning": "Assumptions and external waiting time, separately",
  "prerequisites": ["Prerequisite"],
  "steps": [
    {
      "text": "One actionable step",
      "sourceIds": ["S1"],
      "evidenceType": "official_documentation",
      "confidence": "high"
    }
  ],
  "commonBlockers": [
    {
      "text": "A likely blocker",
      "sourceIds": ["S2"],
      "evidenceType": "third_party_documentation",
      "confidence": "medium"
    }
  ],
  "agentCanDo": ["A task an AI coding agent can prepare or implement"],
  "developerMustDo": ["A task requiring the developer"],
  "confidenceNotes": "What is confirmed, inferred and unknown",
  "validationChecklist": ["A practical test the developer should perform"]
}

For evidenceType use only:
official_documentation, third_party_documentation, inference.

For confidence use only:
high, medium, low.

Do not cite a source ID unless it appears in the supplied research.
`;

  const geminiUrl =
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;

  const requestBody = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  };

  // One bounded retry for temporary upstream errors.
  let geminiResponse = await fetch(geminiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    cache: "no-store",
    signal: AbortSignal.timeout(120000),
  });

  if ([429, 500, 502, 503, 504].includes(geminiResponse.status)) {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      cache: "no-store",
      signal: AbortSignal.timeout(45000),
    });
  }

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    console.error("Gemini error:", errorText);
    throw new Error(`AI report generation failed (${geminiResponse.status}). Please try again.`);
  }

  const geminiData = await geminiResponse.json();
  const generatedText =
    geminiData.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("") || "";

  if (!generatedText) {
    throw new Error("Gemini returned an empty report. Please try again.");
  }

  const guide = parseGeminiJson(generatedText, sources);

  return {
    guide,
    sources,
    composio: composioResult,
    researchType: "Composio API lookup + documentation-based AI research",
    verifiedByHandsOnTest: false,
    generatedAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = String(body.query || "").trim();

    if (!query) {
      return NextResponse.json({ error: "Please provide an app name." }, { status: 400 });
    }

    if (query.length > 80) {
      return NextResponse.json({ error: "Please enter a shorter app name." }, { status: 400 });
    }

    const cacheKey = query.toLowerCase().replace(/\s+/g, " ");

    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_DURATION) {
      return NextResponse.json({ ...cached.data, fromCache: true });
    }

    const existingRequest = inFlight.get(cacheKey);
    if (existingRequest) {
      const data = await existingRequest;
      return NextResponse.json({ ...data, fromCache: false });
    }

    const researchPromise = generateResearch(query);
    inFlight.set(cacheKey, researchPromise);

    try {
      const data = await researchPromise;

      if (cache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey) cache.delete(oldestKey);
      }

      cache.set(cacheKey, { data, time: Date.now() });
      return NextResponse.json({ ...data, fromCache: false });
    } finally {
      inFlight.delete(cacheKey);
    }
  } catch (error) {
    console.error("OAuth Atlas research error:", error);

    const message =
      error instanceof Error
        ? error.name === "TimeoutError"
          ? "Research took too long because an external service did not respond. Please try again."
          : error.message
        : "Something went wrong while researching this app.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
