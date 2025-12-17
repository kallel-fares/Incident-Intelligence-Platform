import { useState, useEffect, useLayoutEffect, useRef } from "react";

const TYPE_STYLE = {
  event: {
    icon: "▶",
    iconCls: "text-white",
    badge: "EVENT",
    badgeCls: "bg-white/10 text-white/80",
    textCls: "text-white font-medium",
  },
  tool: {
    icon: "→",
    iconCls: "text-blue-400",
    badge: "TOOL",
    badgeCls: "bg-blue-500/20 text-blue-300",
    textCls: "text-blue-300",
  },
  result: {
    icon: "✓",
    iconCls: "text-green-400",
    badge: "",
    badgeCls: "",
    textCls: "text-green-300",
  },
  anomaly: {
    icon: "⚠",
    iconCls: "text-red-400",
    badge: "",
    badgeCls: "",
    textCls: "text-red-300 font-medium",
  },
  analysis: {
    icon: "⚡",
    iconCls: "text-amber-400",
    badge: "ANLS",
    badgeCls: "bg-amber-500/15 text-amber-300",
    textCls: "text-amber-300",
  },
  rag: {
    icon: "◉",
    iconCls: "text-purple-400",
    badge: "RAG",
    badgeCls: "bg-purple-500/20 text-purple-300",
    textCls: "text-purple-300",
  },
  loop: {
    icon: "⟳",
    iconCls: "text-cyan-400",
    badge: "",
    badgeCls: "",
    textCls: "text-cyan-300",
  },
  context: {
    icon: "⚡",
    iconCls: "text-amber-300",
    badge: "CTX",
    badgeCls: "bg-amber-500/15 text-amber-200",
    textCls: "text-amber-200",
  },
  sub: {
    icon: " ",
    iconCls: "",
    badge: "",
    badgeCls: "",
    textCls: "text-slate-500",
  },
  reasoning: {
    icon: "›",
    iconCls: "text-slate-500",
    badge: "",
    badgeCls: "",
    textCls: "text-slate-400 italic text-[10.5px]",
  },
  complete: {
    icon: "✓",
    iconCls: "text-green-300",
    badge: "DONE",
    badgeCls: "bg-green-500/20 text-green-300",
    textCls: "text-green-300 font-semibold",
  },
};

// Token-like reveal: 3–7 char chunks at a 18–45ms variable cadence.
function StreamingText({ text }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let cancelled = false;
    let i = 0;
    let timer;
    function tick() {
      if (cancelled) return;
      if (i >= text.length) return;
      const remaining = text.length - i;
      const chunk = Math.min(remaining, 3 + Math.floor(Math.random() * 5));
      i += chunk;
      setDisplayed(text.slice(0, i));
      timer = setTimeout(tick, 18 + Math.random() * 27);
    }
    timer = setTimeout(tick, 20);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);
  return <>{displayed}</>;
}

function TraceLine({ step, streaming }) {
  const s = TYPE_STYLE[step.type] || TYPE_STYLE.result;
  return (
    <div
      className={`flex gap-1.5 items-baseline py-px ${step.upstream ? "border-l-2 border-red-500/70 pl-1.5 -ml-1.5" : ""}`}
    >
      <span className="text-slate-600 shrink-0 w-22 text-[10px]">
        {step.timestamp}
      </span>
      <span className={`shrink-0 w-3 text-center leading-none ${s.iconCls}`}>
        {s.icon}
      </span>
      <span
        className={`shrink-0 w-9 text-[8.5px] font-bold text-center rounded px-0.5 leading-4 ${s.badgeCls}`}
      >
        {s.badge}
      </span>
      <span className={`flex-1 break-all leading-5 ${s.textCls}`}>
        {streaming ? <StreamingText text={step.text} /> : step.text}
      </span>
    </div>
  );
}

// skipAnimation=true: used when replaying a completed trace (e.g. in 'done' phase).
// Shows all steps instantly instead of scheduling timeouts, preventing animation restarts
// on remount.
export default function ReasoningTrace({
  steps,
  onComplete,
  skipAnimation = false,
}) {
  const [revealed, setRevealed] = useState(0);
  const [done, setDone] = useState(false);
  const containerRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!steps?.length) return;

    if (skipAnimation) {
      setRevealed(steps.length);
      setDone(true);
      return;
    }

    setRevealed(0);
    setDone(false);

    const timeouts = steps.map((step, i) =>
      setTimeout(() => setRevealed(i + 1), step.delay),
    );

    const lastStep = steps[steps.length - 1];
    const lastDelay = lastStep.delay;
    // If the last step is a streaming reasoning line, give it room to finish
    // streaming + a read buffer before marking the trace done.
    const completeBuffer =
      lastStep.type === "reasoning" ? lastStep.text.length * 12 + 1000 : 1000;
    const doneTimeout = setTimeout(() => {
      setDone(true);
      onCompleteRef.current?.();
    }, lastDelay + completeBuffer);

    return () => {
      timeouts.forEach(clearTimeout);
      clearTimeout(doneTimeout);
    };
  }, [steps, skipAnimation]);

  // Synchronous scroll before paint — useLayoutEffect prevents the browser from
  // painting the un-scrolled state. overflowAnchor:none on the container stops
  // the browser's scroll-anchoring from reversing our scrollTop assignment.
  useLayoutEffect(() => {
    if (skipAnimation || !containerRef.current) return;
    const el = containerRef.current;
    el.scrollTop = el.scrollHeight - el.clientHeight;
  }, [revealed, skipAnimation]);

  const visible = steps?.slice(0, revealed) || [];

  return (
    <div
      ref={containerRef}
      className="h-72 overflow-y-auto rounded border border-(--border) p-3 font-mono text-[11px] leading-5 select-text"
      style={{ background: "#080a0f", overflowAnchor: "none" }}
    >
      {visible.map((step) => (
        <TraceLine
          key={step.id}
          step={step}
          streaming={!skipAnimation && step.type === "reasoning"}
        />
      ))}

      {!done && revealed > 0 && (
        <div className="flex gap-1.5 items-baseline py-px">
          <span className="w-22" />
          <span className="w-3" />
          <span className="w-9" />
          <span className="text-blue-400 animate-pulse text-sm leading-none">
            ▊
          </span>
        </div>
      )}

      {done && (
        <div className="mt-1 text-[10px] text-green-500/60 pl-[calc(5.5rem+0.375rem+0.75rem+2.25rem+0.375rem)]">
          ─── trace complete ───
        </div>
      )}
    </div>
  );
}
