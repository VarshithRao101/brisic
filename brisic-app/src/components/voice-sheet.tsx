"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Track } from "@/lib/catalog/types";
import { askBrisicAI } from "@/app/actions";
import { usePlayer } from "@/components/app-state";
import { Cover } from "@/components/cover";
import { Icon } from "@/components/icons";

// Minimal typing for the browser speech API (Chrome, Edge, Safari, Android).
type SpeechResultList = { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } };
type Recognition = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: { results: SpeechResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};
type RecognitionCtor = new () => Recognition;
const getRecognition = (): RecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

type Phase = "idle" | "listening" | "thinking" | "result" | "error";
const BARS = Array.from({ length: 28 }, (_, i) => ({
  h: 30 + ((i * 29) % 7) * 12,
  d: (0.55 + ((i * 37) % 10) / 14).toFixed(2),
  dl: (((i * 53) % 10) / 12).toFixed(2),
}));
const PROMPTS = ["Play some Afrobeats", "Something chill for tonight", "Songs by Kelechi Ade", "Gospel to start my day"];

function Bars() {
  return (
    <div className="flex h-28 items-center justify-center gap-1" aria-hidden="true">
      {BARS.map((b, i) => (
        <span
          key={i}
          className="w-[5px] rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.55)]"
          style={{ height: b.h, animation: `brisicWave ${b.d}s ease-in-out ${b.dl}s infinite` }}
        />
      ))}
    </div>
  );
}

/**
 * Brisic AI sheet opened from the centre button of the bottom bar.
 * "Ask" turns speech (or typing) into music picks; "Identify" explains song recognition status.
 */
export function VoiceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const player = usePlayer();
  const [mode, setMode] = useState<"ask" | "identify">("ask");
  const [phase, setPhase] = useState<Phase>("idle");
  const [heard, setHeard] = useState("");
  const [typed, setTyped] = useState("");
  const [reply, setReply] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [error, setError] = useState("");
  const rec = useRef<Recognition | null>(null);
  const heardRef = useRef("");
  const [supported] = useState(() => getRecognition() !== null);

  const ask = useCallback(async (text: string) => {
    const q = text.trim();
    if (!q) { setPhase("idle"); return; }
    setError("");
    setHeard(q);
    setPhase("thinking");
    try {
      const r = await askBrisicAI(q);
      setReply(r.reply);
      setResults(r.tracks.slice(0, 5));
      setPhase("result");
    } catch {
      setError("Brisic AI could not answer right now. Try again.");
      setPhase("error");
    }
  }, []);

  const stop = useCallback(() => {
    rec.current?.abort();
    rec.current = null;
  }, []);

  const listen = useCallback(() => {
    const Ctor = getRecognition();
    setHeard(""); setReply(""); setResults([]); setError("");
    heardRef.current = "";
    if (!Ctor) { setPhase("idle"); return; }
    stop();
    const r = new Ctor();
    r.lang = "en-NG";
    r.interimResults = true;
    r.continuous = false;
    r.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      heardRef.current = text;
      setHeard(text);
    };
    r.onerror = (e) => {
      setError(e.error === "not-allowed" || e.error === "service-not-allowed"
        ? "Microphone access is blocked. Allow it in your browser, or type below."
        : e.error === "no-speech" ? "I didn't catch that. Tap the mic and try again." : "Voice input stopped. Try again or type below.");
      setPhase("error");
    };
    r.onend = () => {
      rec.current = null;
      if (heardRef.current.trim()) void ask(heardRef.current);
      else setPhase((p) => (p === "listening" ? "idle" : p));
    };
    rec.current = r;
    setPhase("listening");
    try { r.start(); } catch { setPhase("idle"); }
  }, [ask, stop]);

  // Start listening when the sheet opens; stop when it closes or unmounts.
  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode("ask");
    if (supported) listen();
    else setPhase("idle");
    return stop;
  }, [open, supported, listen, stop]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const status = { idle: supported ? "Tap the mic and speak" : "Type what you want to hear", listening: "Listening…", thinking: "Thinking…", result: "Here you go", error: "" }[phase];

  return (
    <div className="fixed inset-0 z-50 bg-[rgba(2,6,3,0.62)] backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Brisic AI"
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[88dvh] max-w-xl flex-col overflow-y-auto rounded-t-[34px] border-t-[1.5px] border-primary/70 px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-5 shadow-[0_-10px_40px_rgba(var(--primary-rgb),0.25)] lg:bottom-6 lg:rounded-[34px] lg:border-[1.5px]"
        style={{ background: "linear-gradient(180deg, var(--glow-top) 0%, var(--bg) 72%)" }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[17px] font-semibold text-white">
            <Icon name="sparkle" size={20} className="text-primary" fill /> Brisic AI
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-white/10 text-ink">
            <Icon name="x" size={18} />
          </button>
        </div>

        <div className="mt-3 flex justify-center gap-2">
          <button type="button" aria-pressed={mode === "ask"} className="chip" onClick={() => { setMode("ask"); if (supported) listen(); }}>
            <Icon name="mic" size={15} /> Ask
          </button>
          <button type="button" aria-pressed={mode === "identify"} className="chip" onClick={() => { stop(); setMode("identify"); setPhase("idle"); }}>
            <Icon name="wave" size={15} /> Identify a song
          </button>
        </div>

        {mode === "identify" ? (
          <div className="mt-6 flex flex-col items-center text-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary text-primary" style={{ animation: "brisicPulse 2.4s ease-in-out infinite" }}>
              <Icon name="wave" size={42} />
            </span>
            <p className="m-0 mt-5 text-[18px] font-semibold text-white">Song recognition is almost here</p>
            <p className="m-0 mt-2 max-w-sm text-[14px] font-light text-muted">
              Naming the song playing around you needs a song-recognition service, which Brisic is adding soon.
              Until then, say or type the song or artist and Brisic AI will find it.
            </p>
            <button type="button" className="btn btn-primary mt-5" onClick={() => { setMode("ask"); if (supported) listen(); }}>
              <Icon name="mic" size={18} /> Say the song name
            </button>
          </div>
        ) : (
          <>
            <p className="m-0 mt-4 text-center text-[14.5px] text-accent">{status}</p>
            {phase === "listening" && <Bars />}
            {phase === "thinking" && (
              <div className="flex h-28 items-center justify-center gap-2.5" aria-hidden="true">
                {[0, 0.15, 0.3].map((d) => (
                  <span key={d} className="h-3.5 w-3.5 rounded-full bg-primary" style={{ animation: `brisicWave 0.9s ease-in-out ${d}s infinite` }} />
                ))}
              </div>
            )}
            {(phase === "idle" || phase === "error") && supported && (
              <div className="flex justify-center py-6">
                <button type="button" onClick={listen} aria-label="Start listening" className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary bg-transparent text-primary" style={{ animation: "brisicPulse 2.4s ease-in-out infinite" }}>
                  <Icon name="mic" size={40} />
                </button>
              </div>
            )}
            {error && <p className="m-0 text-center text-[13.5px] text-[#ffb3b3]" role="alert">{error}</p>}
            {heard && <p className="m-0 mt-2 min-h-[1.5em] px-2 text-center text-[21px] leading-snug text-white">“{heard}”</p>}

            {phase === "result" && (
              <>
                <p className="m-0 mt-1 text-center text-[14px] font-light text-ink/80">{reply}</p>
                <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
                  {results.map((t, i) => (
                    <li key={t.id} className="flex h-14 items-center gap-3 rounded-2xl border border-line bg-card-2 pl-1.5 pr-2.5" style={{ background: "var(--card-2)" }}>
                      <span className="w-11 shrink-0"><Cover seed={t.albumId ?? t.id} src={t.artwork} className="!rounded-lg" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] text-white">{t.title}</span>
                        <span className="block truncate text-[12.5px] font-light text-muted">{t.artistName}</span>
                      </span>
                      <button type="button" aria-label={`Play ${t.title}`} onClick={() => { player.playQueue(results, i); onClose(); }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-transparent text-ink">
                        <Icon name="play" size={14} className="ml-0.5" />
                      </button>
                    </li>
                  ))}
                </ul>
                {results.length === 0 && <p className="m-0 mt-3 text-center text-[13.5px] text-muted">No matches yet. Try a genre, mood or artist.</p>}
                <div className="mt-4 flex justify-center gap-2">
                  {supported && <button type="button" className="btn btn-outline btn-sm" onClick={listen}>Ask something else</button>}
                  <Link href="/ai" onClick={onClose} className="btn btn-sm">Open Brisic AI</Link>
                </div>
              </>
            )}

            <form
              className="mt-5 flex items-center gap-2"
              onSubmit={(e) => { e.preventDefault(); stop(); void ask(typed); setTyped(""); }}
            >
              <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="Ask Brisic AI to play anything…" aria-label="Ask Brisic AI" className="field !h-11 !text-[15px]" />
              <button type="submit" aria-label="Send" disabled={!typed.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-0 bg-primary text-primary-ink disabled:opacity-40">
                <Icon name="send" size={18} />
              </button>
            </form>
            {phase !== "result" && (
              <div className="no-scrollbar -mx-6 mt-3 flex gap-2 overflow-x-auto px-6">
                {PROMPTS.map((p) => (
                  <button key={p} type="button" className="chip shrink-0" onClick={() => { stop(); void ask(p); }}>{p}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
