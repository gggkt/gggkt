import path from 'node:path';
import fs from 'fs-extra';

import { truncateText } from './text';

export async function ensureContextDir(projectPath: string): Promise<string> {
  const contextDir = path.join(projectPath, '.context');
  await fs.ensureDir(contextDir);
  return contextDir;
}

export async function safeReadFile(filePath: string, maxLength?: number): Promise<string | undefined> {
  try {
    const exists = await fs.pathExists(filePath);
    if (!exists) {
      return undefined;
    }

    const content = await fs.readFile(filePath, 'utf8');
    return typeof maxLength === 'number' ? truncateText(content, maxLength) : content;
  } catch {
    return undefined;
  }
}
