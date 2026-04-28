import path from 'node:path';

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.txt', '.yml', '.yaml',
  '.xml', '.java', '.kt', '.py', '.go', '.rs', '.sh', '.env', '.css', '.scss', '.html',
  '.vue', '.sql', '.toml', '.ini', '.properties'
]);

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}\n\n... [内容已截断，总长度 ${text.length} 字符]`;
}

export function readFirstLines(text: string, maxLines: number): string {
  return text.split(/\r?\n/).slice(0, maxLines).join('\n');
}

export function isProbablyTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  if (!ext) {
    return true;
  }

  return TEXT_EXTENSIONS.has(ext);
}
