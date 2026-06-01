"use client";

import { useState, useRef, useEffect } from "react";
import { useProjectStore } from "@/store/project";
import { getTotalWordCount } from "@/lib/project/schema";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function wordsWrittenOn(history: Record<string, number>, date: string): number {
  const todayVal = history[date] ?? 0;
  const prevDate = addDays(date, -1);
  const prevVal = history[prevDate] ?? 0;
  return Math.max(0, todayVal - prevVal);
}

function computeStreak(history: Record<string, number>, goal: number): number {
  let streak = 0;
  let date = getToday();
  while (true) {
    const written = wordsWrittenOn(history, date);
    if (written >= goal) {
      streak++;
      date = addDays(date, -1);
    } else {
      break;
    }
  }
  return streak;
}

export function WordCountWidget() {
  const { project, save } = useProjectStore();
  const [open, setOpen] = useState(false);
  const [editGoal, setEditGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!project) return null;

  const history = project.wordCountHistory ?? {};
  const goal = project.settings.dailyWordCountGoal ?? 0;
  const today = getToday();
  const todayWords = wordsWrittenOn(history, today);
  const streak = goal > 0 ? computeStreak(history, goal) : 0;
  const pct = goal > 0 ? Math.min(1, todayWords / goal) : 0;

  const saveGoal = async (val: string) => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 0) return;
    project.settings.dailyWordCountGoal = n;
    await save();
    setEditGoal(false);
  };

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[var(--bg-panel)] transition-colors"
        title="Word count & streak"
      >
        {/* Mini progress ring */}
        {goal > 0 && (
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="6" fill="none" stroke="var(--border)" strokeWidth="2" />
            <circle
              cx="8" cy="8" r="6" fill="none"
              stroke={pct >= 1 ? "#22c55e" : "var(--accent)"}
              strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 6}`}
              strokeDashoffset={`${2 * Math.PI * 6 * (1 - pct)}`}
              strokeLinecap="round"
              transform="rotate(-90 8 8)"
            />
          </svg>
        )}
        <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
          {todayWords.toLocaleString()}
          {goal > 0 && ` / ${goal.toLocaleString()}`}
        </span>
        {streak > 1 && (
          <span className="text-xs" style={{ color: "#f59e0b" }}>🔥{streak}</span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1 rounded-lg p-4 z-40"
          style={{
            width: 340,
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Today summary */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Today — {todayWords.toLocaleString()} words
            </span>
            {streak > 0 && goal > 0 && (
              <span className="text-xs" style={{ color: "#f59e0b" }}>
                🔥 {streak}-day streak
              </span>
            )}
          </div>

          {/* Goal setting */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>Daily goal:</span>
            {editGoal ? (
              <>
                <input
                  autoFocus
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveGoal(goalDraft);
                    if (e.key === "Escape") setEditGoal(false);
                  }}
                  onBlur={() => saveGoal(goalDraft)}
                  className="w-20 px-2 py-0.5 rounded text-xs border bg-transparent outline-none"
                  style={{ borderColor: "var(--accent)", color: "var(--text)" }}
                  placeholder="words"
                />
              </>
            ) : (
              <button
                onClick={() => { setGoalDraft(goal > 0 ? String(goal) : ""); setEditGoal(true); }}
                className="text-xs underline-offset-2 underline"
                style={{ color: "var(--accent)" }}
              >
                {goal > 0 ? `${goal.toLocaleString()} words` : "Set a goal"}
              </button>
            )}
          </div>

          {/* Heatmap — last 18 weeks */}
          <HeatmapCalendar history={history} goal={goal} />
        </div>
      )}
    </div>
  );
}

function HeatmapCalendar({
  history,
  goal,
}: {
  history: Record<string, number>;
  goal: number;
}) {
  const weeks = 18;
  const today = getToday();

  // Build grid: each column is a week (Sun→Sat), starting from (weeks) weeks ago
  const startDate = addDays(today, -(weeks * 7 - 1));
  const days: { date: string; words: number }[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const date = addDays(startDate, i);
    days.push({ date, words: wordsWrittenOn(history, date) });
  }

  // Group into weeks of 7
  const columns: { date: string; words: number }[][] = [];
  for (let w = 0; w < weeks; w++) {
    columns.push(days.slice(w * 7, w * 7 + 7));
  }

  const cellColor = (words: number) => {
    if (words === 0) return "var(--bg-panel)";
    if (goal <= 0) return "#22c55e66";
    const pct = words / goal;
    if (pct >= 1) return "#22c55e";
    if (pct >= 0.5) return "#22c55e88";
    return "#22c55e44";
  };

  return (
    <div>
      <div className="flex gap-0.5">
        {columns.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map(({ date, words }) => (
              <div
                key={date}
                title={`${date}: ${words.toLocaleString()} words`}
                className="w-3.5 h-3.5 rounded-sm"
                style={{ backgroundColor: cellColor(words) }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1 mt-2">
        <span className="text-xs" style={{ color: "var(--text-faint)" }}>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: v === 0 ? "var(--bg-panel)" : `rgba(34,197,94,${v})` }}
          />
        ))}
        <span className="text-xs" style={{ color: "var(--text-faint)" }}>More</span>
      </div>
    </div>
  );
}
