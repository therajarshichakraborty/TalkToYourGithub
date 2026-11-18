export function repositoryPath(owner: string, name: string) {
  return `/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;
}

export function githubUrl(owner: string, name: string, suffix = "") {
  return `https://github.com/${owner}/${name}${suffix}`;
}
