'use strict';
// The Vercel Services entrypoint must load the tsc-compiled NestJS application.
// Bundling decorated TypeScript directly can corrupt NestJS decorators and metadata.
// The service build runs apps/api/package.json#build before tracing this entrypoint.
// eslint-disable-next-line @typescript-eslint/no-require-imports, no-undef -- This CJS shim must load tsc output to preserve NestJS decorators.
require('../dist/main.js');
