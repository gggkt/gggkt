import path from 'node:path';

import fs from 'fs-extra';
import OpenAI from 'openai';

import type { AppConfig, ProjectContext } from '../types';
import { truncateText } from '../utils/text';

const MAX_JSON_CONTEXT = 30000;

function buildContextPayload(context: ProjectContext): string {
  const payload = {
    projectPath: context.projectPath,
    projectName: context.projectName,
    projectType: context.projectType,
    generatedAt: context.generatedAt,
    git: {
      ...context.git,
      diff: context.git.diff ? truncateText(context.git.diff, 12000) : undefined
    },
    files: {
      readme: context.files.readme ? truncateText(context.files.readme, 5000) : undefined,
      packageJson: context.files.packageJson ? truncateText(context.files.packageJson, 5000) : undefined,
      pomXml: context.files.pomXml ? truncateText(context.files.pomXml, 5000) : undefined,
      recentFiles: context.files.recentFiles.map((file) => ({
        ...file,
        excerpt: file.excerpt ? truncateText(file.excerpt, 2000) : undefined
      }))
    },
    todos: context.todos,
    previousMemory: context.previousMemory
      ? {
          ...context.previousMemory,
          rawLastReport: context.previousMemory.rawLastReport
            ? truncateText(context.previousMemory.rawLastReport, 5000)
            : undefined
        }
      : null
  };

  return truncateText(JSON.stringify(payload, null, 2), MAX_JSON_CONTEXT);
}

async function loadPromptTemplate(): Promise<string> {
  const promptPath = path.resolve(__dirname, '../../templates/recall-prompt.md');
  const fallbackPath = path.resolve(process.cwd(), 'templates/recall-prompt.md');

  try {
    return await fs.readFile(promptPath, 'utf8');
  } catch {
    return fs.readFile(fallbackPath, 'utf8');
  }
}

export async function runReasoner(context: ProjectContext, config: AppConfig): Promise<string> {
  const client = new OpenAI({
    apiKey: config.openaiApiKey,
    baseURL: config.openaiBaseUrl
  });

  const [promptTemplate, contextPayload] = await Promise.all([
    loadPromptTemplate(),
    Promise.resolve(buildContextPayload(context))
  ]);

  try {
    const completion = await client.chat.completions.create({
      model: config.openaiModel,
      temperature: 0.2,
      messages: [
        { role: 'system', content: promptTemplate },
        {
          role: 'user',
          content: `以下是当前项目采集到的上下文信息（JSON）：\n\n${contextPayload}\n\n请按固定结构输出中文 Markdown 报告。`
        }
      ]
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) {
      throw new Error('LLM 返回为空内容。');
    }

    return content;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`调用 LLM 生成报告失败：${message}`);
  }
}
