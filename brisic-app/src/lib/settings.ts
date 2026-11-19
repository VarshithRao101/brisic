/**
 * Music player colors, exactly as in the prototype: the green player is hue-shifted by
 * `hue` degrees (Chrome turns it silver). Only the full-screen player changes; the rest of
 * the app stays Brisic green.
 */
export const PLAYER_COLORS = [
  { id: "green", name: "Green", hue: 0, swatch: "#4ade80" },
  { id: "blue", name: "Blue", hue: 89, swatch: "#4aa3ff" },
  { id: "purple", name: "Purple", hue: 149, swatch: "#a56bff" },
  { id: "pink", name: "Pink", hue: 199, swatch: "#ff5fb0" },
  { id: "red", name: "Red", hue: 229, swatch: "#ff4a4a" },
  { id: "orange", name: "Orange", hue: 259, swatch: "#ff9a3c" },
  { id: "gold", name: "Gold", hue: 282, swatch: "#f2c94c" },
  { id: "teal", name: "Teal", hue: 49, swatch: "#2fd8c8" },
  { id: "chrome", name: "Chrome", hue: null, swatch: "#cfd6d2" },
] as const;
export const isPlayerColor = (v: unknown) => PLAYER_COLORS.some((c) => c.id === v);
/** CSS filter that turns the green player into the chosen color. */
export const playerFilter = (id: string) => {
  const c = PLAYER_COLORS.find((x) => x.id === id);
  if (!c || c.hue === 0) return "none";
  return c.hue === null ? "grayscale(1) brightness(1.15)" : `hue-rotate(${c.hue}deg)`;
};

/** How artists and cards look: round frames, or guitar-pick frames with slanted cards. */
export const HOME_STYLES = [
  { id: "shaped", name: "Shaped", blurb: "Slanted cards, soft glow" },
  { id: "classic", name: "Classic", blurb: "Round and simple" },
] as const;

export const QUALITIES = ["Normal", "High", "Very high"] as const;
export const LANGUAGES = ["English", "Nigerian Pidgin", "Yoruba", "Igbo", "Hausa", "Twi", "Swahili", "Zulu", "French", "Portuguese", "Spanish"] as const;

export type Settings = {
  playerColor: string;
  homeStyle: string;
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
  playerColor: "green",
  homeStyle: "shaped",
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

export function readSettings(json: unknown): Settings {
  const out: Settings = { ...DEFAULT_SETTINGS };
  if (json && typeof json === "object") {
    const src = json as Record<string, unknown>;
    for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[]) {
      if (typeof src[k] === typeof DEFAULT_SETTINGS[k]) (out as Record<string, unknown>)[k] = src[k];
    }
    // Accounts from the short-lived app-wide themes keep their pick as the player color.
    if (!isPlayerColor(src.playerColor) && isPlayerColor(src.theme)) out.playerColor = src.theme as string;
  }
  if (!isPlayerColor(out.playerColor)) out.playerColor = DEFAULT_SETTINGS.playerColor;
  if (!HOME_STYLES.some((h) => h.id === out.homeStyle)) out.homeStyle = DEFAULT_SETTINGS.homeStyle;
  if (!(QUALITIES as readonly string[]).includes(out.streamingQuality)) out.streamingQuality = DEFAULT_SETTINGS.streamingQuality;
  if (!(QUALITIES as readonly string[]).includes(out.downloadQuality)) out.downloadQuality = DEFAULT_SETTINGS.downloadQuality;
  if (!(LANGUAGES as readonly string[]).includes(out.language)) out.language = DEFAULT_SETTINGS.language;
  return out;
}
