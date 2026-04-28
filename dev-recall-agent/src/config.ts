import dotenv from 'dotenv';

import type { AppConfig } from './types';

export function loadConfig(): AppConfig {
  dotenv.config();

  const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
  const openaiBaseUrl = process.env.OPENAI_BASE_URL?.trim();
  const openaiModel = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  if (!openaiApiKey) {
    throw new Error(
      '缺少 OPENAI_API_KEY。请先复制 .env.example 为 .env 并填写 OPENAI_API_KEY 后再运行。'
    );
  }

  return {
    openaiApiKey,
    openaiBaseUrl: openaiBaseUrl || undefined,
    openaiModel
  };
}
