/** App-wide color themes. Each id maps to a [data-theme] block in globals.css. */
export const THEMES = [
  { id: "green", name: "Green", swatch: "linear-gradient(135deg,#a8eeb3,#4ade80 55%,#14532d)" },
  { id: "red", name: "Red", swatch: "linear-gradient(135deg,#ffb3ad,#ff4a4a 55%,#5a0f0f)" },
  { id: "chrome", name: "Chrome", swatch: "linear-gradient(135deg,#ffffff,#b9c2be 45%,#4b5651 75%,#e3e8e6)" },
  { id: "purple", name: "Purple", swatch: "linear-gradient(135deg,#dcc6ff,#a56bff 55%,#2a0f45)" },
  { id: "gold", name: "Gold", swatch: "linear-gradient(135deg,#fff1c2,#f2c94c 50%,#7a5a0a)" },
] as const;
export type ThemeId = (typeof THEMES)[number]["id"];

export const QUALITIES = ["Normal", "High", "Very high"] as const;
export const LANGUAGES = ["English", "Nigerian Pidgin", "Yoruba", "Igbo", "Hausa", "Twi", "Swahili", "Zulu", "French", "Portuguese", "Spanish"] as const;

export type Settings = {
  theme: string;
  streamingQuality: string;
  downloadQuality: string;
  language: string;
  crossfade: boolean;
  gapless: boolean;
  autoplay: boolean;
  normalize: boolean;
  dataSaver: boolean;
  wifiOnly: boolean;
  notifyReleases: boolean;
  notifyParty: boolean;
  notifyGifts: boolean;
  privateSession: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "green",
  streamingQuality: "High",
  downloadQuality: "High",
  language: "English",
  crossfade: false,
  gapless: true,
  autoplay: true,
  normalize: true,
  dataSaver: false,
  wifiOnly: true,
  notifyReleases: true,
  notifyParty: true,
  notifyGifts: true,
  privateSession: false,
};

export const isTheme = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);

export function readSettings(json: unknown): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS };
  if (json && typeof json === "object") {
    const src = json as Record<string, unknown>;
    for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      if (typeof src[k] === typeof DEFAULT_SETTINGS[k]) (out as Record<string, unknown>)[k] = src[k];
    }
    // Older accounts saved a player color; carry it over when it matches a theme.
    if (!("theme" in src) && isTheme(src.playerColor)) out.theme = src.playerColor;
  }
  if (!isTheme(out.theme)) out.theme = DEFAULT_SETTINGS.theme;
  if (!(QUALITIES as readonly string[]).includes(out.streamingQuality)) out.streamingQuality = DEFAULT_SETTINGS.streamingQuality;
  if (!(QUALITIES as readonly string[]).includes(out.downloadQuality)) out.downloadQuality = DEFAULT_SETTINGS.downloadQuality;
  if (!(LANGUAGES as readonly string[]).includes(out.language)) out.language = DEFAULT_SETTINGS.language;
  return out;
}
