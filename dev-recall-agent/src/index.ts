#!/usr/bin/env node

import path from 'node:path';

import { Command } from 'commander';
import fs from 'fs-extra';

import { collectProjectFiles } from './collectors/fileCollector';
import { collectGitInfo } from './collectors/gitCollector';
import { collectProjectInfo } from './collectors/projectCollector';
import { collectTodos } from './collectors/todoCollector';
import { loadConfig } from './config';
import { loadMemory, saveMemory } from './memory/memoryStore';
import { buildContext } from './parsers/contextBuilder';
import { runReasoner } from './reasoner/llmReasoner';
import { writeReport } from './reporter/markdownReporter';

async function main(projectPathInput: string): Promise<void> {
  const config = loadConfig();

  const resolvedProjectPath = path.resolve(process.cwd(), projectPathInput);
  const exists = await fs.pathExists(resolvedProjectPath);

  if (!exists) {
    throw new Error(`目标目录不存在: ${resolvedProjectPath}`);
  }

  const stat = await fs.stat(resolvedProjectPath);
  if (!stat.isDirectory()) {
    throw new Error(`目标路径不是目录: ${resolvedProjectPath}`);
  }

  const previousMemory = await loadMemory(resolvedProjectPath);
  const projectInfo = await collectProjectInfo(resolvedProjectPath);
  const [git, files, todos] = await Promise.all([
    collectGitInfo(resolvedProjectPath),
    collectProjectFiles(resolvedProjectPath),
    collectTodos(resolvedProjectPath)
  ]);

  const context = buildContext({
    projectPath: resolvedProjectPath,
    projectInfo,
    git,
    files,
    todos,
    previousMemory
  });

  const report = await runReasoner(context, config);
  const reportPath = await writeReport(resolvedProjectPath, report);
  await saveMemory(resolvedProjectPath, report);

  console.log('✅ Dev Recall 报告生成完成');
  console.log(`- 报告: ${reportPath}`);
  console.log(`- 记忆: ${path.join(resolvedProjectPath, '.context', 'memory.json')}`);
}

const program = new Command();

program
  .name('dev-recall')
  .description('开发上下文恢复 Agent：读取项目信息并生成恢复报告')
  .argument('<projectPath>', '项目目录路径')
  .action(async (projectPathInput: string) => {
    try {
      await main(projectPathInput);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ 执行失败: ${message}`);
      process.exitCode = 1;
    }
  });

program.parse();
