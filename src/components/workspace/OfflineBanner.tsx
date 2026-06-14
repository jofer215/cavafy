// Cavafy — free novel writing software
// Copyright (C) 2024  Joshua Ferris
// SPDX-License-Identifier: GPL-3.0-or-later
"use client";

import { useEffect, useState, useCallback } from "react";
import { pendingQueue } from "@/lib/cache/db";
import { WifiOff, RefreshCw, CheckCircle } from "lucide-react";

type SyncState = "idle" | "offline" | "syncing" | "synced";

export function OfflineBanner() {
  const [syncState, setSyncState] = useState<SyncState>("idle");
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    const all = await pendingQueue.getAll();
    setPendingCount(all.length);
    if (all.length > 0 && navigator.onLine) setSyncState("idle");
  }, []);

  const flushQueue = useCallback(async () => {
    const writes = await pendingQueue.getAll();
    if (writes.length === 0) return;

    setSyncState("syncing");
    let failed = 0;

    for (const write of writes) {
      try {
        const res = await fetch(write.url, {
          method: write.method,
          headers: { "Content-Type": "application/json" },
          body: write.body,
        });
        if (res.ok && write.id != null) {
          await pendingQueue.delete(write.id);
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    if (failed === 0) {
      setPendingCount(0);
      setSyncState("synced");
      setTimeout(() => setSyncState("idle"), 3000);
    } else {
      setPendingCount(failed);
      setSyncState("idle");
    }
  }, []);

  useEffect(() => {
    if (!navigator.onLine) setSyncState("offline");

    const handleOffline = () => setSyncState("offline");
    const handleOnline = () => {
      setSyncState("idle");
      flushQueue();
    };
    const handlePendingChanged = () => refreshPendingCount();

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("cavafy:pending-writes-changed", handlePendingChanged);

    refreshPendingCount();

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("cavafy:pending-writes-changed", handlePendingChanged);
    };
  }, [flushQueue, refreshPendingCount]);

  if (syncState === "idle" && pendingCount === 0) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1 rounded-md text-xs font-medium"
      style={{
        backgroundColor: syncState === "offline"
          ? "var(--bg-panel)"
          : syncState === "synced"
            ? "#22c55e22"
            : "var(--bg-panel)",
        color: syncState === "synced" ? "#22c55e" : "var(--text-muted)",
        border: "1px solid var(--border)",
      }}
    >
      {syncState === "offline" && (
        <>
          <WifiOff size={11} />
          Offline{pendingCount > 0 ? ` — ${pendingCount} unsaved` : " — reading from cache"}
        </>
      )}
      {syncState === "syncing" && (
        <>
          <RefreshCw size={11} className="animate-spin" />
          Syncing…
        </>
      )}
      {syncState === "synced" && (
        <>
          <CheckCircle size={11} />
          Synced
        </>
      )}
      {syncState === "idle" && pendingCount > 0 && (
        <>
          <WifiOff size={11} />
          {pendingCount} unsaved
          <button
            onClick={flushQueue}
            className="underline underline-offset-2 hover:no-underline"
          >
            Sync now
          </button>
        </>
      )}
    </div>
  );
}
