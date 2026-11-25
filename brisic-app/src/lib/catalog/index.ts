import { brisicCatalog } from "./brisic";
import { globalTuneCatalog } from "./globaltune";
import type { CatalogProvider } from "./types";

export * from "./types";

/**
 * The active music source. Default: Brisic's own catalog (creator uploads, with the sample
 * catalog filling the gaps). CATALOG_PROVIDER="globaltune" switches to the Global Tune adapter.
 */
export const catalog: CatalogProvider = process.env.CATALOG_PROVIDER === "globaltune" ? globalTuneCatalog : brisicCatalog;
