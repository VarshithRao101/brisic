import { brisicCatalog } from "./brisic";
import { globalTuneCatalog } from "./globaltune";
import type { CatalogProvider } from "./types";

export * from "./types";

/**
 * The active music source: Brisic's own catalog (creator uploads and admin playlists).
 * CATALOG_PROVIDER="globaltune" switches to the Global Tune adapter if that API ever arrives.
 */
export const catalog: CatalogProvider = process.env.CATALOG_PROVIDER === "globaltune" ? globalTuneCatalog : brisicCatalog;
