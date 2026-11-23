// Shared, browser-safe readability processing core.
// It deliberately has no Node.js imports so the online and local editions use
// the same extraction, language, tokenisation and scoring rules.

export const MAX_HTML_CHARS = 6_000_000;
const PROCESSING_FINGERPRINT_SEPARATOR = '\n--web-readability-radar-syllable-dictionary--\n';

// A validation snapshot is tied to both the code and the language dictionary
// it actually used. Normalising line endings makes the result independent of
// Git's Windows checkout setting.
export function processingFingerprintMaterial(coreSource, syllableDictionary) {
  return `${String(coreSource ?? '').replace(/\r\n?/g, '\n')}${PROCESSING_FINGERPRINT_SEPARATOR}${JSON.stringify(syllableDictionary ?? {})}`;
}

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const RAW_TEXT_TAGS = new Set(['script', 'style', 'noscript', 'svg', 'template']);
const EXCLUDED_TEXT_TAGS = new Set(['script', 'style', 'noscript', 'svg', 'template', 'nav', 'footer', 'aside', 'form', 'dialog']);

export function createReadabilityCore({
  englishSyllableDictionary = {},
  spanishSyllableDictionary = {},
  crypto = globalThis.crypto,
  maxHtmlChars = MAX_HTML_CHARS,
} = {}) {
  const englishSyllableCache = new Map();
  const spanishSyllableCache = new Map();

  function assertSupportedHtmlSize(html) {
    const value = String(html ?? '');
    if (value.length > maxHtmlChars) throw new Error('PAGE_HTML_TOO_LARGE');
    return value;
  }

  function canonicalUrl(value) {
    const url = new URL(value);
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_[a-z]+|fbclid|gclid|mc_[a-z]+)$/i.test(key)) url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return url;
  }

  function normalizeUrlKey(value) {
    try {
      const normalized = canonicalUrl(value);
      normalized.pathname = normalized.pathname.replace(/\/+$/, '') || '/';
      return normalized.href;
    } catch {
      return String(value).replace(/\/$/, '');
    }
  }

  function sectionForUrl(url, startHost = null) {
    if (startHost && url.hostname !== startHost) return `subdomain:${url.hostname}`;
    const first = url.pathname.split('/').filter(Boolean)[0];
    return first ? `/${first}/` : '/';
  }

  function parseHtmlDocument(html) {
    const source = String(html ?? '');
    const root = { tag: '#document', children: [] };
    const stack = [root];
    let index = 0;
    const appendText = value => { if (value) stack.at(-1).children.push({ text: value }); };
    while (index < source.length) {
      if (source.startsWith('<!--', index)) {
        index = source.indexOf('-->', index + 4);
        index = index < 0 ? source.length : index + 3;
        continue;
      }
      if (source[index] !== '<') {
        const end = source.indexOf('<', index);
        appendText(source.slice(index, end < 0 ? source.length : end));
        index = end < 0 ? source.length : end;
        continue;
      }
      let end = index + 1;
      let quote = '';
      while (end < source.length) {
        const character = source[end];
        if (quote) {
          if (character === quote) quote = '';
        } else if (character === '"' || character === "'") {
          quote = character;
        } else if (character === '>') {
          break;
        }
        end += 1;
      }
      if (end >= source.length) {
        appendText(source.slice(index));
        break;
      }
      const token = source.slice(index + 1, end).trim();
      index = end + 1;
      if (!token || token.startsWith('!') || token.startsWith('?')) continue;
      if (token.startsWith('/')) {
        const closing = token.slice(1).trim().toLowerCase();
        for (let cursor = stack.length - 1; cursor > 0; cursor -= 1) {
          if (stack[cursor].tag === closing) {
            stack.length = cursor;
            break;
          }
        }
        continue;
      }
      const tag = token.split(/[\s/>]/, 1)[0].toLowerCase();
      if (!tag) continue;
      const node = { tag, children: [] };
      stack.at(-1).children.push(node);
      if (RAW_TEXT_TAGS.has(tag)) {
        const closing = `</${tag}`;
        const closeAt = source.toLowerCase().indexOf(closing, index);
        index = closeAt < 0 ? source.length : (source.indexOf('>', closeAt) + 1 || source.length);
        continue;
      }
      if (!VOID_TAGS.has(tag) && !token.endsWith('/')) stack.push(node);
    }
    return root;
  }

  function findHtmlNodes(root, tag) {
    const nodes = [];
    const visit = (node, excludedAncestor = false) => {
      if (!node.tag) return;
      const excluded = excludedAncestor || EXCLUDED_TEXT_TAGS.has(node.tag);
      if (node.tag === tag && !excluded) nodes.push(node);
      for (const child of node.children ?? []) visit(child, excluded);
    };
    visit(root);
    return nodes;
  }

  function nodeText(node, excludedAncestor = false) {
    if (node.text !== undefined) return excludedAncestor ? '' : decodeEntities(node.text);
    const excluded = excludedAncestor || EXCLUDED_TEXT_TAGS.has(node.tag);
    return (node.children ?? []).map(child => nodeText(child, excluded)).join(' ');
  }

  function extractTitle(html) {
    const title = findHtmlNodes(parseHtmlDocument(html), 'title')[0];
    return title ? cleanText(nodeText(title)).slice(0, 160) : '';
  }

  function extractVisibleText(html) {
    return cleanText(nodeText(parseHtmlDocument(html)));
  }

  function extractTextBlocks(html) {
    // A fragment is a complete semantic paragraph, never a sentence-sized slice or a visual card.
    return findHtmlNodes(parseHtmlDocument(html), 'p').map(node => cleanText(nodeText(node))).filter(Boolean);
  }

  function extractDeclaredLanguage(html) {
    return String(html ?? '').match(/<html\b[^>]*\blang\s*=\s*["']([a-z]{2})(?:-[a-z]+)?["']/i)?.[1]?.toLowerCase() ?? null;
  }

  function cleanText(text) {
    const normalized = decodeEntities(text)
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.;:!?])/g, '$1');
    // A trailing image credit is page metadata, not prose for a readability score.
    return normalized
      .replace(/\s*[\[(]\s*(?:imagen|foto|fotograf[ií]a|image|photo|cr[eé]dito|fuente)\s*:\s*[^\])]+[\])]\s*$/iu, '')
      .trim();
  }

  function decodeEntities(text) {
    const entities = {
      amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
      aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ',
      Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ',
    };
    return String(text ?? '')
      .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
      .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
      .replace(/&([a-zA-Z]+);/g, (full, name) => entities[name] ?? full);
  }

  function spanishTokens(text) {
    const tokens = String(text).normalize('NFC').toLowerCase().match(/\b(?:v\.g|p\.ej)(?=\.|\s|$)|\p{L}+(?:[-'\u2010\u2011]\p{L}+)*|\p{N}+(?:[.,]\p{N}+)*|[\p{Sc}\p{Sm}%@#&\u2030\u00a7\u00a9\u00ae]/gu) ?? [];
    const abbreviations = new Set(['sr', 'sra', 'srta', 'dr', 'dra', 'av', 'avda', 'etc', 'fig', 'vg', 'v', 'g', 'pta', 'ptas', 'p', 'pag', 'pág', 'pags', 'págs', 'ud', 'uds', 'd', 'dña', 'prof', 'profa', 'núm', 'num']);
    return tokens.map(token => ({
      text: token,
      syllables: !/\p{L}/u.test(token) || abbreviations.has(token) || ['v.g', 'p.ej'].includes(token)
        ? 1
        : countSpanishSyllables(token.replace(/[\u2010\u2011]/g, '-')),
    }));
  }

  function spanishSentenceSegments(text) {
    // Domains, URLs and decimal values contain periods or commas that are not sentence boundaries.
    const protectedText = String(text)
      .replace(/\b(?:https?:\/\/|www\.)[^\s<>()]+/giu, ' enlace ')
      .replace(/\b[\p{L}\p{N}_-]+(?:\.[\p{L}\p{N}_-]+)+\b/gu, ' dominio ')
      .replace(/\b\p{N}+(?:[.,]\p{N}+)+\b/gu, ' número ');
    return protectedText
      .split(/[.;:¿?¡!\u2014]+/u)
      .filter(segment => spanishTokens(segment).length > 0);
  }

  function englishTokens(text) {
    return String(text).match(/(?:[A-Za-z](?:\.[A-Za-z])+(?:\.)?|[A-Za-z]+(?:['’\-][A-Za-z]+)*|\d+(?:[.,]\d+)*)/g) ?? [];
  }

  function textStats(text, language) {
    if (language !== 'en') {
      const tokens = spanishTokens(text);
      const sentences = spanishSentenceSegments(text).length;
      return { words: tokens.length, sentences, syllables: tokens.reduce((sum, token) => sum + token.syllables, 0) };
    }
    const words = englishTokens(text);
    const sentences = Math.max(1, (String(text).match(/[.!?]+(\s|$)/g) ?? []).length);
    const syllables = words.reduce((sum, word) => sum + countEnglishSyllables(word), 0);
    return { words: words.length, sentences, syllables: Math.max(syllables, words.length) };
  }

  function detectTextLanguage(text) {
    const words = (String(text).toLowerCase().match(/[a-záéíóúüñàèìòùâêîôûäëïöüç]+(?:['-][a-záéíóúüñàèìòùâêîôûäëïöüç]+)?/gi) ?? [])
      .map(word => word.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
      .filter(word => word.length > 1);
    if (!words.length) return 'unknown';
    const samples = new Set(words.slice(0, 180));
    const hasSpanishChars = /[áéíóúüñ¿¡]/i.test(text);
    const hasFrenchChars = /[àâæçéèêëîïôœùûüÿ]/i.test(text);
    const dictionaries = {
      es: ['de', 'la', 'el', 'los', 'las', 'que', 'en', 'y', 'del', 'para', 'con', 'una', 'por', 'universidad', 'estudiantes', 'investigacion', 'formacion'],
      en: ['the', 'and', 'of', 'to', 'in', 'for', 'with', 'that', 'this', 'are', 'is', 'students', 'research', 'university', 'education', 'through'],
      fr: ['de', 'la', 'le', 'les', 'des', 'du', 'et', 'en', 'pour', 'avec', 'une', 'dans', 'est', 'universite', 'recherche', 'enseignement', 'etudiants'],
    };
    const scores = Object.fromEntries(Object.entries(dictionaries).map(([lang, markers]) => [lang, markers.filter(marker => samples.has(marker)).length]));
    if (hasSpanishChars) scores.es += 2;
    if (hasFrenchChars) scores.fr += 2;
    if (/\b(the|and|of|to|with|through|research|students|university)\b/i.test(text)) scores.en += 2;
    if (/\b(el|los|las|que|para|universidad|estudiantes|investigacion)\b/i.test(text)) scores.es += 2;
    if (/\b(le|les|des|dans|universite|recherche|enseignement|etudiants)\b/i.test(String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, ''))) scores.fr += 2;
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    if (ranked[0][1] === 0 || ranked[0][1] === ranked[1][1]) return 'unknown';
    return ranked[0][0];
  }

  function countSyllables(word, language) {
    return language === 'en' ? countEnglishSyllables(word) : countSpanishSyllables(word);
  }

  function normalizeEnglishToken(word) {
    const normalized = String(word).normalize('NFC').replace(/[’]/g, "'").toLowerCase();
    if (/^[a-z](?:\.[a-z])+\.$/.test(normalized)) return normalized;
    return normalized.replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
  }

  function englishDictionaryCounts(word) {
    const counts = englishSyllableDictionary?.[word];
    return Array.isArray(counts) && counts.length ? counts : null;
  }

  function acronymLetterSyllables(letter) {
    return { a: 1, b: 1, c: 1, d: 1, e: 1, f: 1, g: 1, h: 1, i: 1, j: 1, k: 1, l: 1, m: 1, n: 1, o: 1, p: 1, q: 1, r: 1, s: 1, t: 1, u: 1, v: 1, w: 3, x: 1, y: 1, z: 1 }[letter] ?? 1;
  }

  function heuristicEnglishSyllables(word) {
    const token = word.replace(/'s$|s'$/g, '').replace(/[^a-z]/g, '');
    if (!token || token.length <= 3) return 1;
    let count = (token.match(/[aeiouy]+/g) ?? []).length;
    if (/e$/.test(token) && !/(?:[^aeiou]le|[^aeiou]ye)$/.test(token)) count -= 1;
    if (/(?:[^aeiou]ed)$/.test(token) && !/(?:ted|ded)$/.test(token)) count -= 1;
    if (/(?:[^sxz]|ch|sh)es$/.test(token) && !/(?:ches|shes|ses|xes|zes|ges|ces)$/.test(token)) count -= 1;
    if (/(?:ia|io|eo|ua|ui|iu)/.test(token)) count += 1;
    if (/^mc/.test(token)) count += 1;
    return Math.max(1, count);
  }

  function resolveEnglishSyllables(word, uppercaseAcronym = false) {
    if (/^\d+(?:[.,]\d+)*$/.test(word)) return 1;
    const counts = englishDictionaryCounts(word)
      ?? englishDictionaryCounts(word.replace(/'s$/, ''))
      ?? englishDictionaryCounts(word.replace(/s'$/, 's'));
    if (counts) return counts[0];
    if (word.includes('-')) return word.split('-').filter(Boolean).reduce((sum, part) => sum + resolveEnglishSyllables(part), 0);
    if (/^[a-z](?:\.[a-z])+(?:\.)?$/.test(word)) return [...word.replace(/\./g, '')].reduce((sum, letter) => sum + acronymLetterSyllables(letter), 0);
    if (uppercaseAcronym && /^[a-z]{2,8}$/.test(word)) return [...word].reduce((sum, letter) => sum + acronymLetterSyllables(letter), 0);
    return heuristicEnglishSyllables(word);
  }

  function countEnglishSyllables(word) {
    const normalized = normalizeEnglishToken(word);
    if (!normalized) return 0;
    if (englishSyllableCache.has(normalized)) return englishSyllableCache.get(normalized);
    const result = resolveEnglishSyllables(normalized, /^[A-Z]{2,8}$/.test(String(word)));
    englishSyllableCache.set(normalized, result);
    return result;
  }

  function englishSyllableSource(word) {
    const normalized = normalizeEnglishToken(word);
    if (!normalized) return 'none';
    if (/^\d+(?:[.,]\d+)*$/.test(normalized)) return 'numeric';
    if (englishDictionaryCounts(normalized) ?? englishDictionaryCounts(normalized.replace(/'s$/, '')) ?? englishDictionaryCounts(normalized.replace(/s'$/, 's'))) return 'cmudict';
    if (normalized.includes('-')) return normalized.split('-').filter(Boolean).map(englishSyllableSource).every(source => source === 'cmudict') ? 'cmudict_compound' : 'heuristic';
    if (/^[a-z](?:\.[a-z])+(?:\.)?$/.test(normalized) || /^[A-Z]{2,8}$/.test(String(word))) return 'acronym';
    return 'heuristic';
  }

  function normalizeSpanishSyllableToken(word) {
    return String(word).normalize('NFC').toLowerCase().replace(/[^a-záéíóúüñ'-]/g, '');
  }

  function spanishDictionarySyllables(word) {
    const count = spanishSyllableDictionary?.[word];
    return Number.isInteger(count) && count > 0 ? count : null;
  }

  function heuristicSpanishSyllables(word) {
    // Preserve stress marks: stripping them merges hiatuses such as pa-is and di-a.
    return String(word).normalize('NFC').toLowerCase().split(/[-']/).reduce((total, part) => {
      const normalized = part.replace(/[^a-záéíóúüñ]/g, '').replace(/([qg])u(?=[eéií])/g, '$1').replace(/y$/g, 'i');
      if (!normalized) return total;
      const runs = normalized.match(/[aeiouáéíóúü](?:h?[aeiouáéíóúü])*/g) ?? [];
      const base = vowel => vowel.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const open = vowel => /[aeoáéó]/.test(vowel);
      const weak = vowel => /[iuü]/.test(vowel);
      const diphthong = (a, b) => base(a) !== base(b)
        && !(open(a) && open(b))
        && !((open(a) && /[íú]/.test(b)) || (/[íú]/.test(a) && open(b)));
      let count = 0;
      for (const run of runs) {
        const vowels = run.replace(/h/g, '');
        for (let index = 0; index < vowels.length;) {
          if (index + 2 < vowels.length && weak(vowels[index]) && open(vowels[index + 1]) && weak(vowels[index + 2])) index += 3;
          else if (index + 1 < vowels.length && diphthong(vowels[index], vowels[index + 1])) index += 2;
          else index += 1;
          count += 1;
        }
      }
      return total + Math.max(1, count);
    }, 0);
  }

  function countSpanishSyllables(word) {
    const normalized = normalizeSpanishSyllableToken(word);
    if (!normalized) return 0;
    if (spanishSyllableCache.has(normalized)) return spanishSyllableCache.get(normalized);
    const result = spanishDictionarySyllables(normalized) ?? heuristicSpanishSyllables(normalized);
    spanishSyllableCache.set(normalized, result);
    return result;
  }

  function spanishSyllableSource(word) {
    const normalized = normalizeSpanishSyllableToken(word);
    if (!normalized) return 'none';
    return spanishDictionarySyllables(normalized) === null ? 'heuristic' : 'pylabeador';
  }

  function readabilityScore(stats, language) {
    if (!stats.words || !stats.sentences) return 0;
    const wordsPerSentence = stats.words / stats.sentences;
    const syllablesPerWord = stats.syllables / stats.words;
    return Math.min(100, language === 'en'
      ? 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord
      : 206.835 - 62.3 * syllablesPerWord - wordsPerSentence);
  }

  function classificationRules(language) {
    const rows = language === 'en'
      ? [[90, 'Very easy', 'green'], [80, 'Easy', 'green'], [70, 'Fairly easy', 'lime'], [60, 'Plain English', 'amber'], [50, 'Fairly difficult', 'orange'], [30, 'Difficult', 'red'], [null, 'Very difficult', 'red']]
      : [[80, 'Muy fácil', 'green'], [65, 'Bastante fácil', 'lime'], [55, 'Normal', 'amber'], [40, 'Algo difícil', 'orange'], [null, 'Muy difícil', 'red']];
    return rows.map(([minimum, label, color]) => ({ minimum, label, color }));
  }

  function levelForScore(score, language) {
    return classificationRules(language).find(row => row.minimum === null || score >= row.minimum).label;
  }

  function deduplicateFragments(fragments) {
    const seen = new Set();
    return fragments.filter(fragment => {
      const key = String(fragment.text).normalize('NFC').replace(/\s+/g, ' ').trim().toLocaleLowerCase('es');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  async function sha256Hex(value) {
    if (!crypto?.subtle) throw new Error('SHA-256 is not available in this environment.');
    const bytes = new TextEncoder().encode(String(value));
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async function textFingerprint(text) {
    return sha256Hex(String(text).normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase());
  }

  async function buildPageId(url) {
    return `P-${(await sha256Hex(normalizeUrlKey(url))).slice(0, 16).toUpperCase()}`;
  }

  async function buildFragmentId(url, index, text) {
    const pageId = await buildPageId(url);
    return `${pageId}-F${String(index + 1).padStart(4, '0')}-${(await sha256Hex(text)).slice(0, 16).toUpperCase()}`;
  }

  async function analyzeHtmlContent({ html, url, language, minFragmentWords, rendering = 'static' }) {
    const normalizedLanguage = language === 'en' ? 'en' : 'es';
    const title = extractTitle(html) || url;
    const pageText = extractVisibleText(html);
    const stats = textStats(pageText, normalizedLanguage);
    const declaredLanguage = extractDeclaredLanguage(html);
    const detectedPageLanguage = detectTextLanguage(pageText);
    const pageLanguage = detectedPageLanguage === 'unknown' && ['es', 'en'].includes(declaredLanguage)
      ? declaredLanguage
      : detectedPageLanguage;
    const blocks = extractTextBlocks(html).map((text, index) => {
      const detected = detectTextLanguage(text);
      const detectedLanguage = detected === 'unknown' && ['es', 'en'].includes(declaredLanguage) ? declaredLanguage : detected;
      return { text: text.trim(), sourceIndex: index + 1, detectedLanguage, stats: textStats(text, normalizedLanguage) };
    });
    const fragmentCandidates = blocks
      .filter(block => block.detectedLanguage === normalizedLanguage)
      .filter(block => block.stats.words >= minFragmentWords)
      .map(block => {
        const rawScore = readabilityScore(block.stats, normalizedLanguage);
        return {
          text: block.text,
          sourceIndex: block.sourceIndex,
          language: block.detectedLanguage,
          words: block.stats.words,
          sentences: block.stats.sentences,
          syllables: block.stats.syllables,
          rawScore,
          score: round1(rawScore),
          level: levelForScore(rawScore, normalizedLanguage),
        };
      });
    const fragments = deduplicateFragments(fragmentCandidates);
    return {
      pageId: await buildPageId(url),
      title,
      pageText,
      stats,
      fullTextScore: readabilityScore(stats, normalizedLanguage),
      declaredLanguage,
      detectedPageLanguage: pageLanguage,
      fragments,
      extraction: {
        blocksDetected: blocks.length,
        languageExcluded: blocks.filter(block => block.detectedLanguage !== normalizedLanguage).length,
        lengthExcluded: blocks.filter(block => block.detectedLanguage === normalizedLanguage && block.stats.words < minFragmentWords).length,
        eligible: fragments.length,
        duplicateParagraphsExcluded: fragmentCandidates.length - fragments.length,
        declaredLanguage,
        detectedPageLanguage: pageLanguage,
        rendering,
      },
      contentFingerprint: await textFingerprint(pageText),
    };
  }

  function round1(value) {
    return Math.round(value * 10) / 10;
  }

  function sampleFragments(fragments, limit, seed = '') {
    const unique = [];
    const seen = new Set();
    for (const fragment of fragments) {
      const key = fragment.fragmentId ?? `${fragment.pageUrl ?? ''}\n${fragment.sourceIndex ?? ''}\n${fragment.text ?? ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(fragment);
      }
    }
    const hash = value => {
      let result = 2166136261;
      for (const character of String(value)) result = Math.imul(result ^ character.codePointAt(0), 16777619);
      return result >>> 0;
    };
    return unique.sort((left, right) => hash(`${seed}:${left.fragmentId ?? left.text}`).toString(16).localeCompare(hash(`${seed}:${right.fragmentId ?? right.text}`).toString(16))).slice(0, limit);
  }

  return Object.freeze({
    assertSupportedHtmlSize,
    canonicalUrl,
    normalizeUrlKey,
    sectionForUrl,
    parseHtmlDocument,
    extractTitle,
    extractVisibleText,
    extractTextBlocks,
    extractDeclaredLanguage,
    cleanText,
    decodeEntities,
    textStats,
    detectTextLanguage,
    countSyllables,
    countEnglishSyllables,
    countSpanishSyllables,
    englishSyllableSource,
    spanishSyllableSource,
    readabilityScore,
    classificationRules,
    levelForScore,
    deduplicateFragments,
    sha256Hex,
    textFingerprint,
    buildPageId,
    buildFragmentId,
    analyzeHtmlContent,
    round1,
    sampleFragments,
  });
}
