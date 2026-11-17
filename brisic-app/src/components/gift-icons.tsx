// Line-art gift icons in the theme color, drawn for Brisic's virtual gifts.
const P: Record<string, string> = {
  mic: "M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM7 11a5 5 0 0 0 10 0M12 16v5M9 21h6",
  speaker: "M6 3h12v18H6zM12 17.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 8.5h.01M12 14.5h.01",
  studiomic: "M9 3h6v8a3 3 0 0 1-6 0zM9 6h6M9 9h6M12 14v4M8 21h8M12 18v3M6 9v2a6 6 0 0 0 12 0V9",
  amp: "M3 6h18v13H3zM3 10h18M7 8h.01M10 8h.01M13 8h.01M8 15a2 2 0 1 0 0-.01M16 15a2 2 0 1 0 0-.01",
  crown: "M3 18h18l1-11-5 4-5-7-5 7-5-4zM3 21h18",
  drums: "M4 9c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 9v8c0 1.7 3.6 3 8 3s8-1.3 8-3V9M3 3l6 5M21 3l-6 5",
  car: "M3 15l2-6a2 2 0 0 1 2-1.5h10A2 2 0 0 1 19 9l2 6v3h-2.5M5.5 18H3v-3h18M7.5 18a2 2 0 1 0 0-.01M16.5 18a2 2 0 1 0 0-.01M5 12h14",
  studio: "M3 11l9-7 9 7M5 9.5V20h14V9.5M9 20v-5h6v5M12 9.5h.01",
  universe: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 12c0-2 4.5-4 10-4s10 2 10 4-4.5 4-10 4-10-2-10-4zM5 4h.01M19 5h.01M18 20h.01M4 19h.01",
  jet: "M2 13l9-2 6-6c1-1 3-1 3 0s-1 2-2 3l-6 6-2 9-2-1 1-7-4 1-1 2-1-1 1-3-2-1z",
  watch: "M8 6l1-3h6l1 3M8 18l1 3h6l1-3M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 9v3l2 1",
};

export function GiftIcon({ id, size = 40, className = "" }: { id: string; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={P[id] ?? P.mic} />
    </svg>
  );
}
