import { readFile } from 'node:fs/promises';
import ts from 'typescript';

// Load the actual TypeScript contract/extractor for offline training. Imports are
// limited to these repository files; no alternate Python feature implementation.
export async function loadTrainingContract() {
  const compile = async path => ts.transpileModule(await readFile(path,'utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const url = text => `data:text/javascript;base64,${Buffer.from(text).toString('base64')}`;
  const configUrl = url(await compile('src/lib/config/tracking.ts'));
  const featureCode = (await compile('src/features/recognition/features.ts')).replaceAll('"@/lib/config/tracking"',JSON.stringify(configUrl));
  const featureModule = await import(url(featureCode));
  const contractModule = await import(url(await compile('ml/rhio/training-contract.ts')));
  return {...featureModule,...contractModule};
}
