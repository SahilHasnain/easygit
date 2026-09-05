import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface GitStatus {
  currentBranch: string;
  isDirty: boolean;
  ahead: number;
  behind: number;
  staged: FileChange[];
  unstaged: FileChange[];
  untracked: FileChange[];
}

export interface FileChange {
  path: string;
  status: "added" | "modified" | "deleted" | "renamed" | "untracked";
  staged: boolean;
}

export interface BranchInfo {
  name: string;
  isCurrent: boolean;
}

class GitService {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel("easyGit");
  }

  private async execGit(args: string, cwd?: string): Promise<string> {
    const workspaceFolder = cwd || this.getWorkspaceFolder();
    if (!workspaceFolder) {
      throw new Error("No workspace folder found");
    }

    try {
      const { stdout } = await execAsync(`git ${args}`, {
        cwd: workspaceFolder,
        maxBuffer: 1024 * 1024,
      });
      return stdout.trim();
    } catch (error: any) {
      const stderr = error.stderr || error.message;
      this.outputChannel.appendLine(`git ${args} failed: ${stderr}`);
      throw new Error(`Git error: ${stderr}`);
    }
  }

  getWorkspaceFolder(): string | undefined {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    return workspaceFolders?.[0]?.uri.fsPath;
  }

  async isGitRepo(): Promise<boolean> {
    try {
      await this.execGit("rev-parse --is-inside-work-tree");
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentBranch(): Promise<string> {
    return this.execGit("rev-parse --abbrev-ref HEAD");
  }

  async getStatus(): Promise<GitStatus> {
    const branch = await this.getCurrentBranch();
    const statusOutput = await this.execGit("status --porcelain=v1");
    const aheadBehind = await this.execGit(
      "rev-list --left-right --count HEAD...@{upstream}"
    ).catch(() => "0\t0");

    const [ahead, behind] = aheadBehind.split("\t").map(Number);

    const staged: FileChange[] = [];
    const unstaged: FileChange[] = [];
    const untracked: FileChange[] = [];

    for (const line of statusOutput.split("\n").filter(Boolean)) {
      const indexStatus = line[0];
      const workStatus = line[1];
      const filePath = line.substring(3);

      if (indexStatus === "?") {
        untracked.push({ path: filePath, status: "untracked", staged: false });
        continue;
      }

      if (indexStatus !== " " && indexStatus !== "?") {
        staged.push({
          path: filePath,
          status: this.mapStatus(indexStatus),
          staged: true,
        });
      }

      if (workStatus !== " " && workStatus !== "?") {
        unstaged.push({
          path: filePath,
          status: this.mapStatus(workStatus),
          staged: false,
        });
      }
    }

    return {
      currentBranch: branch,
      isDirty: staged.length > 0 || unstaged.length > 0 || untracked.length > 0,
      ahead,
      behind,
      staged,
      unstaged,
      untracked,
    };
  }

  private mapStatus(code: string): FileChange["status"] {
    switch (code) {
      case "A":
        return "added";
      case "D":
        return "deleted";
      case "R":
        return "renamed";
      case "M":
        return "modified";
      default:
        return "modified";
    }
  }

  async stageAll(): Promise<void> {
    await this.execGit("add -A");
  }

  async stageFile(filePath: string): Promise<void> {
    await this.execGit(`add "${filePath}"`);
  }

  async unstageFile(filePath: string): Promise<void> {
    await this.execGit(`reset HEAD "${filePath}"`);
  }

  async commit(message: string): Promise<string> {
    const result = await this.execGit(`commit -m "${message}"`);
    const match = result.match(/\[[\w]+\s+([a-f0-9]+)\]/);
    return match?.[1] || "";
  }

  async push(): Promise<void> {
    const branch = await this.getCurrentBranch();
    await this.execGit(`push origin ${branch}`);
  }

  async pull(): Promise<void> {
    const branch = await this.getCurrentBranch();
    await this.execGit(`pull origin ${branch}`);
  }

  async fetch(): Promise<void> {
    await this.execGit("fetch --all --prune");
  }

  async getBranches(): Promise<BranchInfo[]> {
    const output = await this.execGit("branch");
    return output.split("\n").filter(Boolean).map((line) => ({
      name: line.replace(/^\*?\s+/, "").trim(),
      isCurrent: line.startsWith("*"),
    }));
  }

  async switchBranch(branch: string): Promise<void> {
    await this.execGit(`checkout "${branch}"`);
  }

  async createBranch(name: string): Promise<void> {
    await this.execGit(`checkout -b "${name}"`);
  }

  async undoLastCommit(): Promise<void> {
    await this.execGit("reset --soft HEAD~1");
  }

  private async hasCommits(): Promise<boolean> {
    try {
      await this.execGit("rev-parse --verify HEAD");
      return true;
    } catch {
      return false;
    }
  }

  async stash(message?: string): Promise<void> {
    const msgFlag = message ? `-m "${message}"` : "";
    await this.execGit(`stash push ${msgFlag} -u`);
  }

  async popStash(): Promise<void> {
    await this.execGit("stash pop");
  }

  async getLog(count: number = 10): Promise<{ hash: string; message: string; date: string }[]> {
    if (!(await this.hasCommits())) {
      return [];
    }
    const format = "%h|%s|%ar";
    const output = await this.execGit(`log --format="${format}" -n ${count}`);
    return output
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [hash, message, date] = line.split("|");
        return { hash, message, date };
      });
  }
}

export const git = new GitService();
