'use strict';
// The Vercel Services entrypoint must load the tsc-compiled NestJS application.
// Bundling decorated TypeScript directly can corrupt NestJS decorators and metadata.
// The service build runs apps/api/package.json#build before tracing this entrypoint.
require('../dist/main.js');
