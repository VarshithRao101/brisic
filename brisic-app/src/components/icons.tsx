const PATHS = {
  home: "M3 11.5 12 4l9 7.5M5 10v10h14V10",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3",
  library: "M4 19V5m5 14V5m6 14 4-14M15 19l4-14",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 20a8 8 0 0 1 16 0",
  sparkle: "M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z",
  heart: "M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6.5 5 5 0 0 1 21.2 11c-2.2 4.6-9.2 9-9.2 9z",
  play: "M7 4.5v15l12-7.5z",
  pause: "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z",
  next: "M5 5v14l10-7zM17 5h2v14h-2z",
  prev: "M19 5v14L9 12zM5 5h2v14H5z",
  shuffle: "M3 7h3.5c2 0 3.2 1 4.5 3l2 4c1.300 2 2.500 3 4.500 3H21M3 17h3.500c1.200 0 2.200-.4 3-1.200M14.500 8.200c.800-.800 1.800-1.200 3-1.200H21M18 4l3 3-3 3M18 14l3 3-3 3",
  plus: "M12 5v14M5 12h14",
  more: "M12 6h.01M12 12h.01M12 18h.01",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l1.500 2h-15zM10 20a2 2 0 0 0 4 0",
  download: "M12 4v11m0 0-4-4m4 4 4-4M5 20h14",
  back: "M15 5l-7 7 7 7",
  queue: "M4 6h12M4 11h12M4 16h7M16 14v6l5-3z",
  radio: "M4 9h16v11H4zM7 9l9-5M15.500 14.500a1.500 1.500 0 1 0 .01 0M8 13h3",
  gift: "M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-1-3-5-3-5-.500S10 7 12 7zm0 0c1-3 5-3 5-.500S14 7 12 7z",
  crown: "M4 18h16l1.500-10-5 4L12 5l-4.500 7-5-4z",
  settings: "M12 15.500a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7zM19 12l2-1.200-2-3.500-2.200.800-1.700-1L14.800 4.800h-4l-.3 2.300-1.700 1L6.600 7.300l-2 3.500L6.600 12l-2 1.200 2 3.500 2.200-.800 1.700 1 .3 2.300h4l.3-2.300 1.700-1 2.200.800 2-3.500z",
  share: "M12 15V4m0 0L8 8m4-4 4 4M5 12v7h14v-7",
  check: "M5 12.500l4.500 4.500L19 7.500",
  lock: "M6 11h12v9H6zM8.500 11V8a3.500 3.500 0 0 1 7 0v3",
  x: "M6 6l12 12M18 6 6 18",
  chevron: "M9 5l7 7-7 7",
  trending: "M3 17l6-6 4 4 8-8M15 7h6v6",
  users: "M9 11a3.500 3.500 0 1 0 0-7 3.500 3.500 0 0 0 0 7zM2.500 20a6.500 6.500 0 0 1 13 0M16 4.200a3.500 3.500 0 0 1 0 6.600M21.500 20a6.500 6.500 0 0 0-4-6",
  mic: "M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zM6 11a6 6 0 0 0 12 0M12 17v4",
  video: "M4 6h11v12H4zM15 10l5-3v10l-5-3",
  coin: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.500 8h3.200a2 2 0 0 1 0 4H9.500m0-4v8m0-4h3.700a2 2 0 0 1 0 4H9.500",
  bag: "M5 8h14l1 12H4zM9 8a3 3 0 0 1 6 0",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.500h.01",
  logout: "M10 4H5v16h5M15 8l4 4-4 4M19 12H9",
  phone: "M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM11 18h2",
  history: "M4 12a8 8 0 1 0 2.500-5.800M4 5v4h4M12 8v4.500l3 1.500",
  trash: "M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13",
  pencil: "M4 20l1-4L16 5l3 3L8 19zM14 7l3 3",
  wave: "M4 11v2M8 7v10M12 3v18M16 8v8M20 10v4",
  books: "M3 4h7v16H3zM14 4h6.500v16H14zM17 8v8",
  homeFill: "M12 3 2.500 11.500h2.800V20h5v-5.500h3.400V20h5v-8.500h2.800z",
  link: "M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1",
  send: "M4 12l16-8-6 16-2.500-6.500z",
  eye: "M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22, className, fill }: { name: IconName; size?: number; className?: string; fill?: boolean }) {
  const solid = fill ?? ["play", "pause", "next", "prev", "homeFill"].includes(name);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={solid ? "currentColor" : "none"}
      stroke={solid ? "none" : "currentColor"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
