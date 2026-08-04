## ADR-007 — Browser persistence implementation

Date: 2026-08-04
Status: Superseded

### Original decision

This record previously selected Dexie as Atlas's browser persistence layer.

### Actual implementation

The shipped feature hooks use `sql.js` (SQLite compiled to WebAssembly) with `idb-keyval` to save the exported database in IndexedDB. The active implementation is in `src/lib/persistence/sqlite.ts`.

### Consequences

- Documentation and future work must describe SQLite-in-IndexedDB as the current behavior, not Dexie.
- The unused Dexie prototype and its dependency were removed during the V1 cleanup.
- The database now includes every current user-facing module and the startup preference; bundled WebAssembly supports offline initialization.
