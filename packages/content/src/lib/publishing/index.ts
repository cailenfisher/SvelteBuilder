// Publishing utilities: feeds, sitemaps, structured data, and publish validation.
//
// Every function here is pure. They take already-fetched entities and a
// DictionaryInstance and return strings or plain objects — no database access, no
// fetch, no async. That is why they stayed when the module's Drizzle query layer
// was removed: they are domain knowledge, not data access.
export * from './rss.js';
export * from './sitemap.js';
export * from './structured-data.js';
export * from './validate-publish.js';
export * from './lead-image.js';
export * from './license.js';
