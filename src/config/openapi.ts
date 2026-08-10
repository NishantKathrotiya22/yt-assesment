import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Resolves the same way from both `src/config` (ts-node, dev) and `dist/config` (compiled, prod) —
// both sit two directories below the project root, and docs/ lives at the root either way.
const openApiPath = path.join(__dirname, '../../docs/openapi.yaml');

export const openApiDocument = yaml.load(fs.readFileSync(openApiPath, 'utf8')) as Record<string, unknown>;
