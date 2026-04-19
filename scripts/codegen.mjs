import { createRequire } from 'module';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const require = createRequire(import.meta.url);
const { codegen } = require('swagger-axios-codegen');

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const outputDir = resolve(dirname(fileURLToPath(import.meta.url)), '../src/lib/api/generated');

console.log(`Fetching swagger spec from ${API_URL}...`);

const response = await fetch(`${API_URL}/swagger/v1/swagger.json`);

if (!response.ok) {
  console.error(`Failed to fetch swagger spec: ${response.status} ${response.statusText}`);
  process.exit(1);
}

const source = await response.json();

await codegen({
  methodNameMode: 'operationId',
  source,
  outputDir,
  fileName: 'index.ts',
  useStaticMethod: false,
  useCustomerRequestInstance: true,
});

console.log(`Generated: src/lib/api/generated/index.ts`);
