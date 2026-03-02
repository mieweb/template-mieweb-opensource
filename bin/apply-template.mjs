#!/usr/bin/env node

/**
 * Apply MIE Web template files to an existing project.
 *
 * Usage:
 *   npx github:mieweb/template-mieweb-opensource
 *   npx @mieweb/template-apply
 */

import { createInterface } from 'node:readline';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import https from 'node:https';

const REPO = 'mieweb/template-mieweb-opensource';
const BRANCH = 'main';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;

/** Template files to apply. Add new entries here as the template grows. */
const TEMPLATE_FILES = [
  {
    path: '.github/copilot-instructions.md',
    description: 'GitHub Copilot instructions (code quality, a11y, i18n, docs)',
  },
  {
    path: '.gitignore',
    description: 'Standard .gitignore for Node.js projects',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * When stdin is piped (non-TTY), pre-read all lines so they don't get lost
 * when readline closes after EOF.
 */
let pipedLines = [];
let pipedIndex = 0;
const isTTY = process.stdin.isTTY;

let rl;
if (isTTY) {
  rl = createInterface({ input: process.stdin, output: process.stdout });
}

function ask(question) {
  if (isTTY) {
    return new Promise((resolve) => rl.question(question, resolve));
  }
  // Non-TTY: use pre-buffered lines
  process.stdout.write(question);
  const answer = pipedLines[pipedIndex++] || '';
  console.log(answer);
  return Promise.resolve(answer);
}

/** Read all stdin lines upfront for piped input. */
function readAllStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.on('data', (chunk) => (data += chunk));
    process.stdin.on('end', () => {
      pipedLines = data.split('\n');
      resolve();
    });
  });
}

/** Fetch a URL over HTTPS, following redirects. */
function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return fetchText(res.headers.location).then(resolve, reject);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
        res.on('error', reject);
      })
      .on('error', reject);
  });
}

/**
 * Merge two files line-by-line, deduplicating entries.
 * Useful for .gitignore where you want to add new rules without duplicates.
 */
function mergeLines(existing, incoming) {
  const existingLines = existing.split('\n');
  const existingSet = new Set(existingLines.map((l) => l.trim()));
  const newLines = incoming
    .split('\n')
    .filter((line) => !existingSet.has(line.trim()));

  if (newLines.length === 0) return existing;

  // Ensure a blank line separator before appended content
  const separator = existingLines.at(-1)?.trim() === '' ? '' : '\n';
  return existing + separator + '\n# ── Added by mieweb template ──\n' + newLines.join('\n');
}

// ── Per-file processing ──────────────────────────────────────────────────────

async function processFile(file) {
  const { path: filePath, description } = file;
  const localPath = join(process.cwd(), filePath);

  console.log(`\n📄  ${filePath}`);
  console.log(`    ${description}`);

  let remoteContent;
  try {
    remoteContent = await fetchText(`${RAW_BASE}/${filePath}`);
  } catch (err) {
    console.log(`    ❌ Failed to fetch: ${err.message}`);
    return;
  }

  if (existsSync(localPath)) {
    const localContent = readFileSync(localPath, 'utf8');

    if (localContent === remoteContent) {
      console.log('    ✅ Already up to date');
      return;
    }

    console.log('    ⚠️  Local file differs from template');
    const answer = await ask(
      '    (o)verwrite / (a)ppend / (m)erge-dedupe / (s)kip? [s]: ',
    );
    const choice = answer.trim().toLowerCase() || 's';

    switch (choice[0]) {
      case 'o':
        writeFileSync(localPath, remoteContent, 'utf8');
        console.log('    ✅ Overwritten');
        break;
      case 'a':
        writeFileSync(localPath, localContent + '\n' + remoteContent, 'utf8');
        console.log('    ✅ Appended');
        break;
      case 'm':
        writeFileSync(localPath, mergeLines(localContent, remoteContent), 'utf8');
        console.log('    ✅ Merged (duplicates skipped)');
        break;
      default:
        console.log('    ⏭️  Skipped');
    }
  } else {
    const answer = await ask('    File does not exist. (c)reate / (s)kip? [c]: ');
    const choice = answer.trim().toLowerCase() || 'c';

    if (choice[0] === 'c') {
      mkdirSync(dirname(localPath), { recursive: true });
      writeFileSync(localPath, remoteContent, 'utf8');
      console.log('    ✅ Created');
    } else {
      console.log('    ⏭️  Skipped');
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Pre-read stdin when piped so lines don't get lost at EOF
  if (!isTTY) await readAllStdin();

  console.log('');
  console.log('🚀 MIE Web Template Applier');
  console.log(`   Source: github.com/${REPO}`);
  console.log(`   Target: ${process.cwd()}`);

  for (const file of TEMPLATE_FILES) {
    await processFile(file);
  }

  console.log('\n✨ Done!\n');
  if (rl) rl.close();
}

main().catch((err) => {
  console.error('Error:', err.message);
  if (rl) rl.close();
  process.exit(1);
});
