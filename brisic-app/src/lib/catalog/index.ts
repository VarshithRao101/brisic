import { globalTuneCatalog } from "./globaltune";
import { mockCatalog } from "./mock";
import type { CatalogProvider } from "./types";

export * from "./types";

/** The active music source. Switch with CATALOG_PROVIDER="globaltune" in .env. */
export const catalog: CatalogProvider =
  process.env.CATALOG_PROVIDER === "globaltune" ? globalTuneCatalog : mockCatalog;
