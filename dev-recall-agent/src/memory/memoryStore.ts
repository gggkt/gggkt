import path from 'node:path';

import fs from 'fs-extra';

import type { ProjectMemory } from '../types';
import { ensureContextDir } from '../utils/fs';
import { truncateText } from '../utils/text';

function extractSection(report: string, heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`##\\s*${escaped}[\\s\\S]*?(?=\\n##\\s|$)`, 'i');
  const match = report.match(pattern);
  return match?.[0] || '';
}

function extractListItems(section: string): string[] {
  return section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean)
    .slice(0, 10);
}

export async function loadMemory(projectPath: string): Promise<ProjectMemory | null> {
  const memoryPath = path.join(projectPath, '.context', 'memory.json');
  try {
    const exists = await fs.pathExists(memoryPath);
    if (!exists) {
      return null;
    }

    const parsed = await fs.readJSON(memoryPath);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return parsed as ProjectMemory;
  } catch {
    return null;
  }
}

export async function saveMemory(projectPath: string, report: string): Promise<void> {
  const contextDir = await ensureContextDir(projectPath);
  const projectName = path.basename(path.resolve(projectPath));

  const summarySection = [extractSection(report, '1. 项目概览'), extractSection(report, '2. 最近工作进展')]
    .filter(Boolean)
    .join('\n\n');

  const nextActionsSection = extractSection(report, '6. 下一步建议');
  const keyFilesSection = extractSection(report, '4. 关键文件');

  const memory: ProjectMemory = {
    projectName,
    lastRunAt: new Date().toISOString(),
    lastSummary: truncateText(summarySection || report, 2000),
    rawLastReport: truncateText(report, 8000),
    lastNextActions: extractListItems(nextActionsSection),
    lastImportantFiles: extractListItems(keyFilesSection)
  };

  await fs.writeJSON(path.join(contextDir, 'memory.json'), memory, { spaces: 2 });
}
