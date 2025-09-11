// lib/analytics.ts
"use client";

type AnalyticsParams = Record<string, unknown> | undefined;

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    // Umami can be a function (v1) or an object with .track/.trackEvent (v2+)
    umami?:
      | ((event: string, data?: Record<string, unknown>) => void)
      | {
          track?: (event: string, data?: Record<string, unknown>) => void;
          trackEvent?: (event: string, data?: Record<string, unknown>) => void;
        };
  }
}

export function track(event: string, params?: AnalyticsParams) {
  if (typeof window === "undefined") return;

  // umami (support both old and new)
  const u = window.umami;
  try {
    if (typeof u === "function") u(event, params as Record<string, unknown> | undefined);
    else if (u && typeof u.trackEvent === "function") u.trackEvent(event, params as Record<string, unknown> | undefined);
    else if (u && typeof u.track === "function") u.track(event, params as Record<string, unknown> | undefined);
  } catch {
    // no-op
  }

  // gtag
  try {
    if (window.gtag) window.gtag("event", event, params ?? {});
  } catch {
    // no-op
  }
}
