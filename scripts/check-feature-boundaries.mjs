import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const projectRoot = process.cwd();
const appCommonRoot = path.join(projectRoot, 'src/app/common');
const dashboardRoot = path.join(projectRoot, 'src/app/dashboard');
const dashboardCommonRoot = path.join(dashboardRoot, 'common');

function collectTypeScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.ts') ? [entryPath] : [];
  });
}

function resolveLocalImport(sourceFile, importPath) {
  if (importPath.startsWith('.')) {
    return path.resolve(path.dirname(sourceFile), importPath);
  }
  if (importPath.startsWith('src/app/')) {
    return path.resolve(projectRoot, importPath);
  }
  return null;
}

function isInside(candidate, directory) {
  return candidate === directory || candidate.startsWith(`${directory}${path.sep}`);
}

const violations = [];
for (const sourceFile of [
  ...collectTypeScriptFiles(appCommonRoot),
  ...collectTypeScriptFiles(dashboardCommonRoot),
]) {
  const source = ts.createSourceFile(
    sourceFile,
    fs.readFileSync(sourceFile, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );

  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const importPath = statement.moduleSpecifier.text;
    const resolvedImport = resolveLocalImport(sourceFile, importPath);
    if (!resolvedImport) continue;

    const appCommonViolation =
      isInside(sourceFile, appCommonRoot) &&
      isInside(resolvedImport, dashboardRoot);
    const dashboardCommonViolation =
      isInside(sourceFile, dashboardCommonRoot) &&
      isInside(resolvedImport, dashboardRoot) &&
      !isInside(resolvedImport, dashboardCommonRoot);

    if (appCommonViolation || dashboardCommonViolation) {
      const line = source.getLineAndCharacterOfPosition(statement.getStart()).line + 1;
      violations.push(
        `${path.relative(projectRoot, sourceFile)}:${line} imports ${importPath}`
      );
    }
  }
}

if (violations.length) {
  console.error('Feature boundary violations found:');
  violations.forEach(violation => console.error(`- ${violation}`));
  process.exit(1);
}

console.log('Feature boundaries are valid.');
