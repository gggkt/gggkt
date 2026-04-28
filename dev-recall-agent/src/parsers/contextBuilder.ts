import type {
  GitInfo,
  ProjectContext,
  ProjectFileInfo,
  ProjectInfo,
  ProjectMemory,
  TodoItem
} from '../types';

interface BuildContextInput {
  projectPath: string;
  projectInfo: ProjectInfo;
  git: GitInfo;
  files: ProjectFileInfo;
  todos: TodoItem[];
  previousMemory?: ProjectMemory | null;
}

export function buildContext(input: BuildContextInput): ProjectContext {
  return {
    projectPath: input.projectPath,
    projectName: input.projectInfo.projectName,
    projectType: input.projectInfo.projectType,
    generatedAt: new Date().toISOString(),
    git: input.git,
    files: input.files,
    todos: input.todos,
    previousMemory: input.previousMemory || null
  };
}
