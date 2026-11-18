export interface Repository {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  description: string;
  defaultBranch: string;
  language: string | null;
  isPrivate: boolean;
  isFork: boolean;
  isArchived: boolean;
  stars: number;
  forks: number;
  openIssues: number;
  htmlUrl: string;
  updatedAt: string | null;
  pushedAt: string | null;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface PullRequest {
  number: number;
  title: string;
  state: string;
  author: string;
  draft: boolean;
  merged: boolean;
  updatedAt: string;
  url: string;
}

export interface Issue {
  number: number;
  title: string;
  state: string;
  author: string;
  labels: string[];
  comments: number;
  updatedAt: string;
  url: string;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  type: "file" | "dir" | "symlink" | "submodule";
}
