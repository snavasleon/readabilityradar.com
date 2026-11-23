import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import { createHash } from 'node:crypto';
import { setTimeout as wait } from 'node:timers/promises';
import { processingFingerprintMaterial } from '../../public/core/readability-core.mjs';

async function availablePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  server.close();
  await once(server, 'close');
  return port;
}

async function waitForServer(child, port) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/bridge-status`);
      if (response.ok) return;
    } catch {
      // The process is still binding its local port.
    }
    await wait(50);
  }
  throw new Error('Timed out while starting the local bridge test server.');
}

const port = await availablePort();
const child = spawn(process.execPath, ['server.mjs', '--port', String(port)], {
  cwd: new URL('../../', import.meta.url),
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});
let stderr = '';
child.stderr.on('data', chunk => { stderr += chunk; });

try {
  await waitForServer(child, port);
  const base = `http://127.0.0.1:${port}`;
  const index = await fetch(`${base}/`);
  const indexHtml = await index.text();
  assert.equal(index.status, 200);
  assert.doesNotMatch(indexHtml, /challenges\.cloudflare\.com/i);
  const core = await fetch(`${base}/core/readability-core.mjs`);
  assert.match(core.headers.get('content-type') || '', /^text\/javascript/i);
  const coreSource = await core.text();
  for (const language of ['es', 'en']) {
    const demo = await fetch(`${base}/demo/${language}`);
    assert.equal(demo.status, 200, `local /demo/${language}`);
    assert.match(await demo.text(), new RegExp(`<html lang="${language}"`, 'i'));
  }
  const dictionaryResponse = await fetch(`${base}/api/dictionary?language=es`);
  assert.equal(dictionaryResponse.status, 200);
  const spanishDictionary = await dictionaryResponse.json();

  for (const input of [
    `http://127.0.0.1:${port}/demo/es`,
    `http://localhost:${port}/demo/es`,
    `http://[::1]:${port}/demo/es`,
    'http://192.168.1.1/',
    'http://169.254.169.254/latest/meta-data',
  ]) {
    const response = await fetch(`${base}/api/analyze`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://readabilityradar.com' },
      body: JSON.stringify({ language: 'es', scope: 'page', input, minWords: 20, minFragmentWords: 10 }),
    });
    assert.equal(response.status, 400, input);
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://readabilityradar.com');
    assert.match((await response.json()).error, /public http\(s\)/i);
  }

  const queuedPrivateTarget = await fetch(`${base}/api/analyze`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://readabilityradar.com' },
    body: JSON.stringify({ background: true, language: 'es', scope: 'page', input: `http://127.0.0.1:${port}/demo/es` }),
  });
  assert.equal(queuedPrivateTarget.status, 400, 'background jobs must reject a private target before queuing');

  const exactLocalPage = await fetch(`${base}/api/analyze`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      language: 'es',
      scope: 'page',
      maxPages: 'all',
      input: `${base}/demo/es`,
      minWords: 20,
      minFragmentWords: 10,
    }),
  });
  const exactLocalPageResult = await exactLocalPage.json();
  assert.equal(exactLocalPage.status, 200);
  assert.equal(exactLocalPageResult.pages[0].status, 'analyzed');
  assert.equal(exactLocalPageResult.criteria.analysisTimeBudgetMs, null);
  assert.equal(exactLocalPageResult.criteria.maxPagesLabel, 'URL exacta o HTML local');

  const local = await fetch(`${base}/api/analyze`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      language: 'es',
      scope: 'page',
      maxPages: 'all',
      htmlInput: '<html lang="es"><body><p>Este texto de prueba tiene suficientes palabras para demostrar que el análisis local sigue funcionando correctamente después de proteger el puente de la web pública.</p></body></html>',
      minWords: 20,
      minFragmentWords: 10,
    }),
  });
  const result = await local.json();
  assert.equal(local.status, 200);
  assert.equal(result.pages[0].status, 'analyzed');
  assert.equal(result.syllableValidation.matchesCurrentProcessing, true);
  assert.equal(result.syllableValidation.matchesCurrentServer, true);
  assert.equal(result.criteria.analysisTimeBudgetMs, null, 'an exact local page must not inherit the 30-second multi-page deadline');
  assert.equal(result.criteria.maxPagesLabel, 'URL exacta o HTML local');
  const expectedProcessingHash = createHash('sha256')
    .update(processingFingerprintMaterial(coreSource, spanishDictionary))
    .digest('hex');
  assert.equal(result.syllableValidation.data.processing_sha256, expectedProcessingHash);
  console.log('PASS: local edition avoids Turnstile, serves shared demos and the shared module, keeps exact pages outside the legacy multi-page deadline, and blocks public-web requests to private network targets.');
} finally {
  child.kill();
  await Promise.race([once(child, 'exit'), wait(2_000)]);
  if (stderr) process.stderr.write(stderr);
}
