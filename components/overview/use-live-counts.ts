"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type LiveStatus = "connecting" | "live" | "offline";

const REFRESH_INTERVAL_MS = 2500;

/**
 * Subscribes to new counts of a session. Each event marks its supplier's station
 * to pulse and schedules a throttled server refresh, so a burst of counts from
 * many teams costs one re-render instead of dozens.
 */
export function useLiveCounts(sessionId: string, enabled: boolean) {
  const router = useRouter();
  const [status, setStatus] = useState<LiveStatus>(enabled ? "connecting" : "offline");
  const [pulses, setPulses] = useState<Record<string, number>>({});
  const [lastEventAt, setLastEventAt] = useState<number | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const supabase = createClient();

    const scheduleRefresh = () => {
      if (refreshTimer.current) return;
      refreshTimer.current = setTimeout(() => {
        refreshTimer.current = null;
        router.refresh();
      }, REFRESH_INTERVAL_MS);
    };

    const channel = supabase
      .channel(`session-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "counts", filter: `session_id=eq.${sessionId}` },
        async (payload) => {
          setLastEventAt(Date.now());
          scheduleRefresh();
          const productId = (payload.new as { product_id?: string })?.product_id;
          if (!productId) return;
          const { data } = await supabase
            .from("session_products")
            .select("supplier_id")
            .eq("id", productId)
            .maybeSingle();
          if (data) setPulses((current) => ({ ...current, [data.supplier_id]: Date.now() }));
        },
      )
      .subscribe((state) => {
        if (state === "SUBSCRIBED") setStatus("live");
        else if (state === "CHANNEL_ERROR" || state === "TIMED_OUT" || state === "CLOSED") {
          setStatus("offline");
        }
      });

    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      supabase.removeChannel(channel);
    };
  }, [enabled, router, sessionId]);

  return { status, pulses, lastEventAt };
}
