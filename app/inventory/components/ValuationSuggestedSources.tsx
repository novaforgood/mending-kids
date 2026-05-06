"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import CrossIcon from "@atlaskit/icon/core/cross";
import {
  searchValuationSources,
  type ValuationSearchResult,
} from "../valuation-search-actions";

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

type LastAction =
  | { type: "accept"; previousValuationSource: string; acceptedUrl: string }
  | { type: "dismiss"; link: string };

type ValuationSuggestedSourcesProps = {
  /** Item name / description used as the search query */
  searchQuery: string;
  valuationSource: string;
  onValuationSourceChange: (value: string) => void;
  sectionLabel?: string;
};

const btnIcon: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 32,
  borderRadius: 4,
  border: "none",
  cursor: "pointer",
  flexShrink: 0,
};

export default function ValuationSuggestedSources({
  searchQuery,
  valuationSource,
  onValuationSourceChange,
  sectionLabel = "Suggested sources (web)",
}: ValuationSuggestedSourcesProps) {
  const debouncedQuery = useDebounced(searchQuery.trim(), 450);
  const [fetched, setFetched] = useState<ValuationSearchResult[]>([]);
  const [dismissedLinks, setDismissedLinks] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);

  const isFilled = valuationSource.trim() !== "";

  const resolvedLastAction = useMemo((): LastAction | null => {
    if (!lastAction) return null;
    if (lastAction.type === "accept" && valuationSource !== lastAction.acceptedUrl) {
      return null;
    }
    return lastAction;
  }, [lastAction, valuationSource]);

  const showAcceptUndo = isFilled && resolvedLastAction?.type === "accept";

  useEffect(() => {
    let cancelled = false;

    if (!debouncedQuery) {
      const id = window.setTimeout(() => {
        if (cancelled) return;
        setFetched([]);
        setDismissedLinks([]);
        setFetchError(null);
        setLoading(false);
        setLastAction((prev) => (prev?.type === "accept" ? prev : null));
      }, 0);
      return () => {
        cancelled = true;
        window.clearTimeout(id);
      };
    }

    void (async () => {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 0);
      });
      if (cancelled) return;
      setLoading(true);
      setFetchError(null);

      const res = await searchValuationSources(debouncedQuery);
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        setFetched([]);
        setFetchError(res.error);
        return;
      }
      setFetched(res.results);
      setDismissedLinks([]);
      setLastAction(null);
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const visible = fetched.filter((r) => !dismissedLinks.includes(r.link));

  const handleAccept = useCallback(
    (item: ValuationSearchResult) => {
      setLastAction({
        type: "accept",
        previousValuationSource: valuationSource,
        acceptedUrl: item.link,
      });
      onValuationSourceChange(item.link);
    },
    [valuationSource, onValuationSourceChange]
  );

  const handleDismiss = useCallback((item: ValuationSearchResult) => {
    setLastAction({ type: "dismiss", link: item.link });
    setDismissedLinks((prev) => [...prev, item.link]);
  }, []);

  const handleUndo = useCallback(() => {
    if (!resolvedLastAction) return;
    if (resolvedLastAction.type === "accept") {
      onValuationSourceChange(resolvedLastAction.previousValuationSource);
    } else {
      setDismissedLinks((prev) => prev.filter((l) => l !== resolvedLastAction.link));
    }
    setLastAction(null);
  }, [resolvedLastAction, onValuationSourceChange]);

  if (isFilled && !showAcceptUndo) {
    return null;
  }

  if (!debouncedQuery && !showAcceptUndo) {
    return null;
  }

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <label
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#172B4D",
          }}
        >
          {sectionLabel}
        </label>
        {resolvedLastAction && (
          <button
            type="button"
            onClick={handleUndo}
            style={{
              background: "none",
              border: "none",
              color: "#0052CC",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              padding: "2px 4px",
            }}
          >
            Undo
          </button>
        )}
      </div>

      {showAcceptUndo && (
        <p style={{ margin: "0 0 8px 0", fontSize: 12, color: "#6B778C" }}>
          Link saved as valuation source. Use Undo to revert.
        </p>
      )}

      {!isFilled && (
        <>
          {loading && (
            <p style={{ margin: 0, fontSize: 13, color: "#6B778C" }}>Searching…</p>
          )}
          {!loading && fetchError && (
            <p style={{ margin: 0, fontSize: 13, color: "#DE350B" }}>{fetchError}</p>
          )}
          {!loading && !fetchError && debouncedQuery && visible.length === 0 && fetched.length > 0 && (
            <p style={{ margin: 0, fontSize: 13, color: "#6B778C" }}>
              All suggestions removed. Undo or change the item name to search again.
            </p>
          )}
          {!loading && !fetchError && debouncedQuery && visible.length === 0 && fetched.length === 0 && (
            <p style={{ margin: 0, fontSize: 13, color: "#6B778C" }}>No results. Try a different name.</p>
          )}
          {!loading && !fetchError && visible.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {visible.map((item) => (
                <div
                  key={item.link}
                  style={{
                    display: "flex",
                    alignItems: "stretch",
                    gap: 8,
                    background: "#F4F5F7",
                    borderRadius: 4,
                    padding: "6px 8px 6px 10px",
                  }}
                >
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      color: "#0052CC",
                      fontSize: 13,
                      textDecoration: "none",
                      alignSelf: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={item.title}
                  >
                    <span style={{ marginRight: 6 }}>🌐</span>
                    {item.title}
                  </a>
                  <button
                    type="button"
                    aria-label="Use this link as valuation source"
                    title="Use as valuation source"
                    onClick={() => handleAccept(item)}
                    style={{
                      ...btnIcon,
                      backgroundColor: "#E3FCEF",
                      color: "#00875A",
                    }}
                  >
                    <CheckMarkIcon label="" size="small" />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove this suggestion"
                    title="Remove suggestion"
                    onClick={() => handleDismiss(item)}
                    style={{
                      ...btnIcon,
                      backgroundColor: "#FFEBE6",
                      color: "#DE350B",
                    }}
                  >
                    <CrossIcon label="" size="small" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
