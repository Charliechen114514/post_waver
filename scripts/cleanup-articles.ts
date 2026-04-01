#!/usr/bin/env node
/**
 * Cleanup Article Redundant Content
 *
 * Removes redundant content extracted from HTML (copyright, navigation, related posts)
 * and fixes image references.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.resolve(__dirname, '../blog/source/_posts');

// Patterns that indicate the end of actual article content
const END_PATTERNS = [
  /^:::::: post-copyright/,
  /^::: post-copyright/,
  /^::::: tag_share/,
  /^::::::::::::::::::::::::::::: relatedPosts/,
];

function shouldEndAtLine(line: string): boolean {
  return END_PATTERNS.some(pattern => pattern.test(line));
}

function fixImageReferences(line: string): string {
  // Fix image references with complex attributes
  // Convert: ![alt](/img/loading.gif){original="image.png"}
  // To: ![alt](/img/image.png)
  return line.replace(
    /!\[(.*?)\]\(\/img\/loading\.gif\)\{original="([^"]+)"\}/g,
    (match, alt, original) => `![${alt}](/img/${original})`
  );
}

function cleanupArticle(filePath: string): { cleaned: boolean, removedLines: number } {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let endLine = lines.length;
  for (let i = 0; i < lines.length; i++) {
    if (shouldEndAtLine(lines[i])) {
      endLine = i;
      break;
    }
  }

  if (endLine === lines.length) {
    return { cleaned: false, removedLines: 0 };
  }

  // Keep only content before the redundant section
  const cleanedLines = lines.slice(0, endLine);

  // Fix image references
  const fixedLines = cleanedLines.map(line => fixImageReferences(line));

  // Remove trailing empty lines
  while (fixedLines.length > 0 && fixedLines[fixedLines.length - 1].trim() === '') {
    fixedLines.pop();
  }

  const removedLines = lines.length - fixedLines.length;
  fs.writeFileSync(filePath, fixedLines.join('\n') + '\n', 'utf-8');

  return { cleaned: true, removedLines };
}

function main() {
  const files = fs.readdirSync(POSTS_DIR)
    .filter(f => f.endsWith('.md'));

  console.log(`🧹 Cleaning up ${files.length} articles...\n`);

  let cleaned = 0;
  let totalRemoved = 0;

  for (const file of files) {
    const filePath = path.join(POSTS_DIR, file);
    const result = cleanupArticle(filePath);

    if (result.cleaned) {
      cleaned++;
      totalRemoved += result.removedLines;
      console.log(`✅ ${file}: removed ${result.removedLines} lines`);
    } else {
      console.log(`⏭️  ${file}: already clean`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Cleaned: ${cleaned}/${files.length}`);
  console.log(`   Total lines removed: ${totalRemoved}`);
}

main();
