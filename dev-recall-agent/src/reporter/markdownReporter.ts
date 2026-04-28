import path from 'node:path';

import fs from 'fs-extra';

import { ensureContextDir } from '../utils/fs';

export async function writeReport(projectPath: string, report: string): Promise<string> {
  const contextDir = await ensureContextDir(projectPath);
  const reportPath = path.join(contextDir, 'context-report.md');
  await fs.writeFile(reportPath, report, 'utf8');
  return reportPath;
}
