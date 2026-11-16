export const PLAYER_COLORS = [
  { id: "green", name: "Green", hex: "#7ee08a" },
  { id: "blue", name: "Blue", hex: "#5ab0ff" },
  { id: "purple", name: "Purple", hex: "#b388ff" },
  { id: "pink", name: "Pink", hex: "#ff7ab8" },
  { id: "red", name: "Red", hex: "#ff6b6b" },
  { id: "orange", name: "Orange", hex: "#ff9f43" },
  { id: "gold", name: "Gold", hex: "#f2c94c" },
  { id: "teal", name: "Teal", hex: "#3dd6c6" },
  { id: "chrome", name: "Chrome", hex: "#cfd8dc" },
] as const;

export const QUALITIES = ["Normal", "High", "Very high"] as const;
export const LANGUAGES = ["English", "Nigerian Pidgin", "Yoruba", "Igbo", "Hausa", "Twi", "Swahili", "Zulu", "French", "Portuguese", "Spanish"] as const;

export type Settings = {
  playerColor: string;
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
  }
  return out;
}

export const playerHex = (id: string) => PLAYER_COLORS.find((c) => c.id === id)?.hex ?? PLAYER_COLORS[0].hex;
