import path from 'node:path';

import fg from 'fast-glob';
import fs from 'fs-extra';

import type { ProjectFileInfo, RecentFile } from '../types';
import { safeReadFile } from '../utils/fs';
import { isProbablyTextFile, readFirstLines, truncateText } from '../utils/text';

const EXCLUDED_DIRS = [
  'node_modules', '.git', 'dist', 'build', 'target', '.idea', '.vscode', 'coverage', '.next', '.nuxt', 'out'
];

const EXCLUDED_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.lock', '.map', '.zip', '.tar', '.gz', '.jar', '.class'
]);

const MAX_RECENT_FILES = 20;
const RECENT_DAYS = 7;
const MAX_EXCERPT_CHARS = 4000;
const MAX_EXCERPT_LINES = 80;

function isExcludedFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return EXCLUDED_EXTENSIONS.has(ext);
}

async function readRecentFileExcerpt(filePath: string): Promise<string | undefined> {
  const content = await safeReadFile(filePath, MAX_EXCERPT_CHARS);
  if (!content) {
    return undefined;
  }

  return truncateText(readFirstLines(content, MAX_EXCERPT_LINES), MAX_EXCERPT_CHARS);
}

export async function collectProjectFiles(projectPath: string): Promise<ProjectFileInfo> {
  const [readme, readmeLower, packageJson, pomXml] = await Promise.all([
    safeReadFile(path.join(projectPath, 'README.md'), 8000),
    safeReadFile(path.join(projectPath, 'readme.md'), 8000),
    safeReadFile(path.join(projectPath, 'package.json'), 8000),
    safeReadFile(path.join(projectPath, 'pom.xml'), 8000)
  ]);

  const recentCutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;

  const entries = await fg(['**/*'], {
    cwd: projectPath,
    onlyFiles: true,
    dot: false,
    absolute: true,
    ignore: EXCLUDED_DIRS.map((d) => `${d}/**`)
  });

  const recentWithStats = await Promise.all(
    entries.map(async (absPath) => {
      try {
        if (isExcludedFile(absPath) || !isProbablyTextFile(absPath)) {
          return null;
        }

        const stat = await fs.stat(absPath);
        if (stat.mtimeMs < recentCutoff) {
          return null;
        }

        const excerpt = await readRecentFileExcerpt(absPath);

        const relPath = path.relative(projectPath, absPath);
        const recentFile: RecentFile = {
          path: relPath,
          lastModified: stat.mtime.toISOString(),
          excerpt
        };

        return {
          file: recentFile,
          mtimeMs: stat.mtimeMs
        };
      } catch {
        return null;
      }
    })
  );

  const recentFiles = recentWithStats
    .filter((entry): entry is { file: RecentFile; mtimeMs: number } => entry !== null)
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .slice(0, MAX_RECENT_FILES)
    .map((entry) => entry.file);

  return {
    readme: readme || readmeLower,
    packageJson,
    pomXml,
    recentFiles
  };
}
