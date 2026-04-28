export interface GitInfo {
  isGitRepo: boolean;
  branch?: string;
  recentCommits: string[];
  status?: string;
  diffStat?: string;
  diff?: string;
}

export interface RecentFile {
  path: string;
  lastModified: string;
  excerpt?: string;
}

export interface ProjectFileInfo {
  readme?: string;
  packageJson?: string;
  pomXml?: string;
  recentFiles: RecentFile[];
}

export interface TodoItem {
  file: string;
  line: number;
  text: string;
}

export interface ProjectMemory {
  projectName: string;
  lastRunAt: string;
  lastSummary?: string;
  lastNextActions?: string[];
  lastImportantFiles?: string[];
  rawLastReport?: string;
}

export interface ProjectInfo {
  projectName: string;
  projectType?: 'Node/TypeScript' | 'Vue' | 'React' | 'Spring Boot' | 'Java Maven' | 'Unknown';
}

export interface ProjectContext {
  projectPath: string;
  projectName: string;
  generatedAt: string;
  projectType?: ProjectInfo['projectType'];
  git: GitInfo;
  files: ProjectFileInfo;
  todos: TodoItem[];
  previousMemory?: ProjectMemory | null;
}

export interface AppConfig {
  openaiApiKey: string;
  openaiBaseUrl?: string;
  openaiModel: string;
}
