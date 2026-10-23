export * from "./types.js";
export * from "./infer.js";
export * from "./registry.js";
export * from "./listing.js";
export * from "./venue-sources.js";
export * from "./catalog/utah-sources.js";export {
  legacyJekyllAdapter,
  matchLegacyJekyllUrl,
  parseLegacyEventMarkdown,
  parseLegacyFrontmatter,
  toRawUrl,
} from "./adapters/legacy-jekyll.js";
export {
  startggUrlAdapter,
  matchStartggUrl,
  extractStartggSlug,
} from "./adapters/startgg-url.js";
export {
  genericEventAdapter,
  matchGenericEventUrl,
  parseGenericEventHtml,
  parseJsonLdEvents,
  parseMetaFallback,
} from "./adapters/generic-event.js";

import { legacyJekyllAdapter } from "./adapters/legacy-jekyll.js";
import { startggUrlAdapter } from "./adapters/startgg-url.js";
import { genericEventAdapter } from "./adapters/generic-event.js";
import { registerAdapter } from "./registry.js";

// Built-in adapter stack: specific → generic catch-all (lower priority runs last).
registerAdapter(startggUrlAdapter);
registerAdapter(legacyJekyllAdapter);
registerAdapter(genericEventAdapter);
