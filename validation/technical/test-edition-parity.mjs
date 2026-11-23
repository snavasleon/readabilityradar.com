import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import { createReadabilityCore } from '../../public/core/readability-core.mjs';
import { analyzeOnline } from '../../public/online-analyzer.js';
import { loadCore } from './load-core.mjs';

const root = new URL('../../', import.meta.url);
const [local, englishDictionarySource, spanishDictionarySource, onlineSource, spanishEasy, spanishDifficult, englishEasy, englishDifficult, spanishDemo, englishDemo] = await Promise.all([
  loadCore(),
  fs.readFile(new URL('resources/cmudict-syllables.json', root), 'utf8'),
  fs.readFile(new URL('resources/pylabeador-syllables.json', root), 'utf8'),
  fs.readFile(new URL('public/online-analyzer.js', root), 'utf8'),
  fs.readFile(new URL('validation/spanish/easy.html', root), 'utf8'),
  fs.readFile(new URL('validation/spanish/difficult.html', root), 'utf8'),
  fs.readFile(new URL('validation/english/easy.html', root), 'utf8'),
  fs.readFile(new URL('validation/english/difficult.html', root), 'utf8'),
  fs.readFile(new URL('public/demo/es.html', root), 'utf8'),
  fs.readFile(new URL('public/demo/en.html', root), 'utf8'),
]);

assert.match(onlineSource, /from '\.\/core\/readability-core\.mjs'/);
assert.doesNotMatch(onlineSource, /DOMParser|function\s+(?:textStats|spanishSyllables|englishSyllables|readabilityScore)\b/);

const browserCore = createReadabilityCore({
  englishSyllableDictionary: JSON.parse(englishDictionarySource).entries,
  spanishSyllableDictionary: JSON.parse(spanishDictionarySource).entries,
  crypto: webcrypto,
});
const fixtures = [
  { id: 'spanish_easy', language: 'es', html: spanishEasy },
  { id: 'spanish_difficult', language: 'es', html: spanishDifficult },
  { id: 'english_easy', language: 'en', html: englishEasy },
  { id: 'english_difficult', language: 'en', html: englishDifficult },
  { id: 'demo_es', language: 'es', html: spanishDemo },
  { id: 'demo_en', language: 'en', html: englishDemo },
  {
    id: 'html_tokenisation_edges',
    language: 'es',
    html: '<!doctype html><html lang="es"><head><title>Prueba aérea</title></head><body><nav>Menú que no debe contar.</nav><main><p>El precio es 3.5 euros. Consulta https://readabilityradar.com/recurso.html para información sobre el término aéreo.</p><p>Otro párrafo completo con suficiente texto para comprobar que las URL, los decimales y los hiatos reciben el mismo tratamiento en ambas ediciones de Radar.</p></main><footer>Pie que no debe contar.</footer></body></html>',
  },
];

for (const fixture of fixtures) {
  const options = {
    html: fixture.html,
    url: `https://example.org/${fixture.id}.html`,
    language: fixture.language,
    minFragmentWords: 1,
  };
  const localResult = await local.core.analyzeHtmlContent(options);
  const browserResult = await browserCore.analyzeHtmlContent(options);
  assert.deepEqual(browserResult, localResult, fixture.id);
}

// Exercise the online runner too. It has no DOM parser of its own; it must
// obtain every count and ID through the same browser-safe core module.
const originalFetch = globalThis.fetch;
globalThis.fetch = async (value) => {
  const url = String(value);
  if (url === '/api/dictionary?language=es') {
    return new Response(spanishDictionarySource, { status: 200 });
  }
  throw new Error(`Unexpected online-runner request: ${url}`);
};
try {
  const fixture = fixtures.find(item => item.id === 'html_tokenisation_edges');
  const expected = await browserCore.analyzeHtmlContent({
    html: fixture.html,
    url: 'local-html://uploaded-file',
    language: 'es',
    minFragmentWords: 10,
    rendering: 'local',
  });
  const online = await analyzeOnline({
    language: 'es',
    scope: 'page',
    input: '',
    htmlInput: fixture.html,
    minWords: 20,
    minFragmentWords: 10,
    maxPages: 1,
    fragmentLimit: null,
  });
  const page = online.pages[0];
  assert.equal(page.pageId, expected.pageId);
  assert.deepEqual({ words: page.words, sentences: page.sentences, syllables: page.syllables, rawScore: page.rawScore, level: page.level, fragments: page.fragments }, {
    ...expected.stats,
    rawScore: expected.fullTextScore,
    level: browserCore.levelForScore(expected.fullTextScore, 'es'),
    fragments: expected.fragments,
  });
  assert.deepEqual(
    online.fragments.map(fragment => fragment.fragmentId).sort(),
    (await Promise.all(expected.fragments.map((fragment, index) => browserCore.buildFragmentId(page.url, index, fragment.text)))).sort(),
  );
} finally {
  globalThis.fetch = originalFetch;
}

await assert.rejects(
  () => analyzeOnline({
    language: 'es',
    scope: 'page',
    input: 'https://example.org/one\nhttps://example.org/two',
    htmlInput: '',
    minWords: 20,
    minFragmentWords: 10,
    maxPages: 'all',
  }),
  /una sola URL/i,
);

console.log(`PASS: local and browser processing match for ${fixtures.length} HTML fixtures, including local and public demo pages, URL, decimal and hiatus tokenisation; the online runner also matches the shared core and rejects a hidden multi-URL web run.`);
