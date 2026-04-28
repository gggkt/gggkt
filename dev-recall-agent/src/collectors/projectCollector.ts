import path from 'node:path';

import { safeReadFile } from '../utils/fs';
import type { ProjectInfo } from '../types';

function inferProjectType(packageJson?: string, pomXml?: string, readme?: string): ProjectInfo['projectType'] {
  const pkgText = packageJson?.toLowerCase() || '';
  const pomText = pomXml?.toLowerCase() || '';
  const readmeText = readme?.toLowerCase() || '';

  if (pkgText.includes('"vue"') || readmeText.includes('vue')) {
    return 'Vue';
  }

  if (pkgText.includes('"react"') || readmeText.includes('react')) {
    return 'React';
  }

  if (pomText.includes('spring-boot') || readmeText.includes('spring boot')) {
    return 'Spring Boot';
  }

  if (pomText.includes('<project') || pomText.includes('<dependencies')) {
    return 'Java Maven';
  }

  if (pkgText.includes('typescript') || pkgText.includes('"node"') || readmeText.includes('node')) {
    return 'Node/TypeScript';
  }

  return 'Unknown';
}

export async function collectProjectInfo(projectPath: string): Promise<ProjectInfo> {
  const projectName = path.basename(path.resolve(projectPath));

  const [packageJson, pomXml, readme, readmeLower] = await Promise.all([
    safeReadFile(path.join(projectPath, 'package.json'), 4000),
    safeReadFile(path.join(projectPath, 'pom.xml'), 4000),
    safeReadFile(path.join(projectPath, 'README.md'), 4000),
    safeReadFile(path.join(projectPath, 'readme.md'), 4000)
  ]);

  return {
    projectName,
    projectType: inferProjectType(packageJson, pomXml, readme || readmeLower)
  };
}
