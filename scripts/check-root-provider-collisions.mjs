#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const APP_ROOT = path.resolve(process.cwd(), 'src', 'app');

function collectTsFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTsFiles(fullPath));
      continue;
    }

    if (
      entry.isFile() &&
      fullPath.endsWith('.ts') &&
      !fullPath.endsWith('.spec.ts') &&
      !fullPath.endsWith('.d.ts')
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function getDecorators(node) {
  if (!ts.canHaveDecorators(node)) {
    return [];
  }

  return ts.getDecorators(node) ?? [];
}

function getPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  if (ts.isComputedPropertyName(name) && ts.isStringLiteral(name.expression)) {
    return name.expression.text;
  }

  return null;
}

function isRootInjectable(classDeclaration) {
  const decorators = getDecorators(classDeclaration);
  for (const decorator of decorators) {
    if (!ts.isCallExpression(decorator.expression)) {
      continue;
    }

    const callExpression = decorator.expression;
    if (!ts.isIdentifier(callExpression.expression)) {
      continue;
    }

    if (callExpression.expression.text !== 'Injectable') {
      continue;
    }

    const argument = callExpression.arguments[0];
    if (!argument || !ts.isObjectLiteralExpression(argument)) {
      continue;
    }

    for (const property of argument.properties) {
      if (!ts.isPropertyAssignment(property)) {
        continue;
      }

      if (getPropertyName(property.name) !== 'providedIn') {
        continue;
      }

      if (ts.isStringLiteral(property.initializer) && property.initializer.text === 'root') {
        return true;
      }
    }
  }

  return false;
}

function getDirectlyProvidedRootServices(providerArray, rootServices) {
  const found = new Set();

  for (const element of providerArray.elements) {
    if (ts.isIdentifier(element)) {
      if (rootServices.has(element.text)) {
        found.add(element.text);
      }
      continue;
    }

    if (!ts.isObjectLiteralExpression(element)) {
      continue;
    }

    for (const property of element.properties) {
      if (!ts.isPropertyAssignment(property)) {
        continue;
      }

      const propertyName = getPropertyName(property.name);
      if (propertyName !== 'useClass' && propertyName !== 'useExisting') {
        continue;
      }

      if (ts.isIdentifier(property.initializer) && rootServices.has(property.initializer.text)) {
        found.add(property.initializer.text);
      }
    }
  }

  return found;
}

const sourceFiles = collectTsFiles(APP_ROOT).map(file => {
  const content = fs.readFileSync(file, 'utf8');
  return {
    file,
    sourceFile: ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true),
  };
});

const rootServices = new Set();

for (const { sourceFile } of sourceFiles) {
  const walk = node => {
    if (ts.isClassDeclaration(node) && node.name && isRootInjectable(node)) {
      rootServices.add(node.name.text);
    }

    ts.forEachChild(node, walk);
  };

  walk(sourceFile);
}

const collisions = [];

for (const { file, sourceFile } of sourceFiles) {
  const walk = node => {
    if (ts.isObjectLiteralExpression(node)) {
      for (const property of node.properties) {
        if (!ts.isPropertyAssignment(property)) {
          continue;
        }

        if (getPropertyName(property.name) !== 'providers') {
          continue;
        }

        if (!ts.isArrayLiteralExpression(property.initializer)) {
          continue;
        }

        const duplicateRootProviders = getDirectlyProvidedRootServices(
          property.initializer,
          rootServices
        );

        if (duplicateRootProviders.size > 0) {
          const position = sourceFile.getLineAndCharacterOfPosition(
            property.getStart(sourceFile)
          );
          collisions.push({
            file: path.relative(process.cwd(), file).split(path.sep).join('/'),
            line: position.line + 1,
            services: [...duplicateRootProviders].sort(),
          });
        }
      }
    }

    ts.forEachChild(node, walk);
  };

  walk(sourceFile);
}

if (collisions.length > 0) {
  console.error('Root service provider collisions detected:');
  for (const collision of collisions) {
    console.error(
      `- ${collision.file}:${collision.line} -> ${collision.services.join(', ')}`
    );
  }
  process.exit(1);
}

console.log('No root service provider collisions detected.');
