import path from 'node:path';

import fg from 'fast-glob';
import fs from 'fs-extra';

import type { TodoItem } from '../types';
import { isProbablyTextFile } from '../utils/text';

const EXCLUDED_DIRS = [
  'node_modules', '.git', 'dist', 'build', 'target', '.idea', '.vscode', 'coverage', '.next', '.nuxt', 'out'
];

const TODO_PATTERNS = ['TODO', 'FIXME', '待处理', '待补充', '临时', '后续优化', '待确认', 'WIP'];
const TODO_REGEX = new RegExp(`(${TODO_PATTERNS.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'i');
const MAX_TODOS = 80;
const MAX_FILE_SIZE = 500 * 1024;

export async function collectTodos(projectPath: string): Promise<TodoItem[]> {
  const files = await fg(['**/*'], {
    cwd: projectPath,
    onlyFiles: true,
    dot: false,
    absolute: true,
    ignore: EXCLUDED_DIRS.map((d) => `${d}/**`)
  });

  const todos: TodoItem[] = [];

  for (const absPath of files) {
    if (todos.length >= MAX_TODOS) {
      break;
    }

    if (!isProbablyTextFile(absPath)) {
      continue;
    }

    try {
      const stat = await fs.stat(absPath);
      if (stat.size > MAX_FILE_SIZE) {
        continue;
      }

      const content = await fs.readFile(absPath, 'utf8');
      const lines = content.split(/\r?\n/);

      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (TODO_REGEX.test(line)) {
          todos.push({
            file: path.relative(projectPath, absPath),
            line: i + 1,
            text: line.trim().slice(0, 300)
          });

          if (todos.length >= MAX_TODOS) {
            break;
          }
        }
      }
    } catch {
      // skip unreadable files
    }
  }

  return todos;
}
