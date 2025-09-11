// lib/analytics.ts
"use client";

type AnalyticsParams = Record<string, unknown> | undefined;

export function track(event: string, params?: AnalyticsParams) {
  if (typeof window === "undefined") return;

  // umami
  // @ts-expect-error - umami is injected at runtime if present
  if (window.umami?.track) window.umami.track(event);

  // gtag
  // @ts-expect-error - gtag is injected at runtime if present
  if (window.gtag) window.gtag("event", event, params ?? {});
}
