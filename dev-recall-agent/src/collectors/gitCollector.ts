import { execa } from 'execa';

import type { GitInfo } from '../types';
import { truncateText } from '../utils/text';

const MAX_DIFF_LENGTH = 12000;

async function runGit(projectPath: string, args: string[]): Promise<string | undefined> {
  try {
    const { stdout } = await execa('git', args, { cwd: projectPath });
    return stdout.trim();
  } catch {
    return undefined;
  }
}

export async function collectGitInfo(projectPath: string): Promise<GitInfo> {
  const inside = await runGit(projectPath, ['rev-parse', '--is-inside-work-tree']);

  if (inside !== 'true') {
    return {
      isGitRepo: false,
      recentCommits: []
    };
  }

  const [branch, commitLog, status, diffStat, diff] = await Promise.all([
    runGit(projectPath, ['branch', '--show-current']),
    runGit(projectPath, ['log', '-5', '--oneline']),
    runGit(projectPath, ['status', '--short']),
    runGit(projectPath, ['diff', '--stat']),
    runGit(projectPath, ['diff'])
  ]);

  return {
    isGitRepo: true,
    branch: branch || undefined,
    recentCommits: commitLog ? commitLog.split(/\r?\n/).filter(Boolean) : [],
    status: status || undefined,
    diffStat: diffStat || undefined,
    diff: diff ? truncateText(diff, MAX_DIFF_LENGTH) : undefined
  };
}
