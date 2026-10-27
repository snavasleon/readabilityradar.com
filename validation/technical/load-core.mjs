import fs from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
export async function loadCore() {
  const source = await fs.readFile(new URL('../../server.mjs', import.meta.url), 'utf8');
  const context = vm.createContext({createHash, URL, LIMITS: {maxHtmlChars: 1800000}});
  const starts = [...source.matchAll(/^(?:async )?function \w+\(/gm)];
  for (let i=0; i<starts.length; i++) {
    if (starts[i][0].startsWith('async ')) continue;
    const end = starts[i+1]?.index ?? source.length;
    vm.runInContext(source.slice(starts[i].index, end), context);
  }
  return {core: context, sha256: createHash('sha256').update(source).digest('hex')};
}
