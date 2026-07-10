const fs = require('fs');
const path = require('path');

// [post-build] Disabled appending ESM export to avoid SyntaxError in browser <script> tags.
// If ESM is required, configure package.json "module" or "exports" and generate a separate .mjs file.

console.log('[post-build] ESM default export appending is disabled to maintain browser compatibility.');
