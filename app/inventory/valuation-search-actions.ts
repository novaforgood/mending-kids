"use server";

export type ValuationSearchResult = {
  title: string;
  link: string;
};

export type ValuationSearchResponse =
  | { ok: true; results: ValuationSearchResult[] }
  | { ok: false; error: string };

const MAX_RESULTS = 3;
/** Ask SerpApi for more rows, then pick the best few (see pickTopResults). */
const SERP_FETCH_NUM = 10;

type SerpApiGoogleJson = {
  organic_results?: { title?: string; link?: string }[];
  error?: string;
};

function buildSerpQuery(raw: string): string {
  const base = raw.trim();
  const extra = process.env.SERPAPI_APPEND_QUERY?.trim();
  return extra ? `${base} ${extra}` : base;
}

function scoreQueryMatch(query: string, title: string, link: string): number {
  const words = query
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^\w]/g, ""))
    .filter((w) => w.length > 2);
  if (words.length === 0) return 0;
  const hay = `${title} ${link}`.toLowerCase();
  return words.reduce((n, w) => (hay.includes(w) ? n + 1 : n), 0);
}

function pickTopResults(query: string, organic: { title?: string; link?: string }[]): ValuationSearchResult[] {
  const mapped: ValuationSearchResult[] = organic
    .map((it) => ({
      title: (it.title ?? it.link ?? "Untitled").trim() || "Untitled",
      link: (it.link ?? "").trim(),
    }))
    .filter((it) => it.link.length > 0);

  if (mapped.length <= MAX_RESULTS) return mapped.slice(0, MAX_RESULTS);

  const scored = mapped.map((item, index) => ({
    item,
    index,
    score: scoreQueryMatch(query, item.title, item.link),
  }));
  scored.sort((a, b) => b.score - a.score || a.index - b.index);

  const seenHosts = new Set<string>();
  const out: ValuationSearchResult[] = [];
  for (const { item } of scored) {
    try {
      const host = new URL(item.link).hostname.replace(/^www\./, "");
      if (seenHosts.has(host)) continue;
      seenHosts.add(host);
    } catch {
      /* keep */
    }
    out.push(item);
    if (out.length >= MAX_RESULTS) break;
  }

  for (const item of mapped) {
    if (out.length >= MAX_RESULTS) break;
    if (!out.some((o) => o.link === item.link)) out.push(item);
  }
  return out.slice(0, MAX_RESULTS);
}

/**
 * Valuation link suggestions — one of:
 *
 * 1) **SERPAPI_API_KEY** (recommended for “all of Google” organic results): uses
 *    SerpApi’s Google engine — not a Google-official API, but returns normal
 *    Google web results. https://serpapi.com/
 *
 * 2) **GOOGLE_CSE_API_KEY** + **GOOGLE_CSE_ID**: Google Custom Search JSON API
 *    (Programmable Search Engine). New engines are limited to sites you list;
 *    there is no supported `*` “whole web” mode anymore.
 */
export async function searchValuationSources(rawQuery: string): Promise<ValuationSearchResponse> {
  const q = rawQuery.trim();
  if (!q) {
    return { ok: true, results: [] };
  }

  const serpKey = process.env.SERPAPI_API_KEY?.trim();
  if (serpKey) {
    return searchViaSerpApiGoogle(q, serpKey);
  }

  const cseKey = process.env.GOOGLE_CSE_API_KEY?.trim();
  const cx = process.env.GOOGLE_CSE_ID?.trim();
  if (cseKey && cx) {
    return searchViaGoogleCse(q, cseKey, cx);
  }

  return {
    ok: false,
    error:
      "Add SERPAPI_API_KEY for full Google-style web results (via SerpApi), or GOOGLE_CSE_API_KEY + GOOGLE_CSE_ID for Google Custom Search (site list required). See env.local.download.",
  };
}

async function searchViaSerpApiGoogle(q: string, apiKey: string): Promise<ValuationSearchResponse> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", buildSerpQuery(q));
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("num", String(SERP_FETCH_NUM));
  url.searchParams.set("hl", process.env.SERPAPI_HL?.trim() || "en");
  url.searchParams.set("gl", process.env.SERPAPI_GL?.trim() || "us");
  url.searchParams.set("google_domain", process.env.SERPAPI_GOOGLE_DOMAIN?.trim() || "google.com");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = (await res.json()) as SerpApiGoogleJson;

    if (!res.ok) {
      return { ok: false, error: data.error || res.statusText || "SerpApi request failed" };
    }
    if (data.error) {
      return { ok: false, error: data.error };
    }

    const organic = data.organic_results ?? [];
    const results = pickTopResults(q, organic);

    return { ok: true, results };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: message };
  }
}

async function searchViaGoogleCse(q: string, apiKey: string, cx: string): Promise<ValuationSearchResponse> {
  const url = new URL("https://www.googleapis.com/customsearch/v1");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("cx", cx);
  url.searchParams.set("q", q);
  url.searchParams.set("num", String(MAX_RESULTS));

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = (await res.json()) as {
      items?: { title?: string; link?: string }[];
      error?: { message?: string };
    };

    if (!res.ok) {
      const msg = data.error?.message ?? res.statusText;
      return { ok: false, error: msg || "Search request failed" };
    }

    const items = data.items ?? [];
    const results: ValuationSearchResult[] = items
      .slice(0, MAX_RESULTS)
      .map((it) => ({
        title: (it.title ?? it.link ?? "Untitled").trim() || "Untitled",
        link: it.link ?? "",
      }))
      .filter((it) => it.link.length > 0);

    return { ok: true, results };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return { ok: false, error: message };
  }
}
