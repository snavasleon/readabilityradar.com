import fs from 'node:fs/promises';
import { createHash, webcrypto } from 'node:crypto';
import { createReadabilityCore, processingFingerprintMaterial } from '../../public/core/readability-core.mjs';

const sha256 = value => createHash('sha256').update(value).digest('hex');

// Validation must exercise the same browser-safe processor used by both
// editions, rather than evaluating a copied slice of server.mjs in a VM.
export async function loadCore() {
  const [serverSource, coreSource, englishSource, spanishSource] = await Promise.all([
    fs.readFile(new URL('../../server.mjs', import.meta.url), 'utf8'),
    fs.readFile(new URL('../../public/core/readability-core.mjs', import.meta.url), 'utf8'),
    fs.readFile(new URL('../../resources/cmudict-syllables.json', import.meta.url), 'utf8'),
    fs.readFile(new URL('../../resources/pylabeador-syllables.json', import.meta.url), 'utf8'),
  ]);
  const englishSyllableDictionary = JSON.parse(englishSource).entries;
  const spanishSyllableDictionary = JSON.parse(spanishSource).entries;
  return {
    core: createReadabilityCore({ englishSyllableDictionary, spanishSyllableDictionary, crypto: webcrypto }),
    // Retained for existing validation artefacts; coreSha256 is the actual
    // source-code fingerprint. Evidence additionally records the language
    // dictionary used in the score calculation.
    sha256: sha256(serverSource),
    coreSha256: sha256(coreSource),
    processingSha256: {
      en: sha256(processingFingerprintMaterial(coreSource, englishSyllableDictionary)),
      es: sha256(processingFingerprintMaterial(coreSource, spanishSyllableDictionary)),
    },
  };
}
