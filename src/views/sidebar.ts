import * as vscode from "vscode";
import { git, FileChange, GitStatus } from "../git/gitService";

type TreeItem = StatusTreeItem;

export class StatusTreeDataProvider
  implements vscode.TreeDataProvider<TreeItem>
{
  private _onDidChangeTreeData =
    new vscode.EventEmitter<TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (element?.children) {
      return element.children;
    }

    if (element) {
      return [];
    }

    if (!(await git.isGitRepo())) {
      return [new StatusTreeItem("Not a git repository", "info")];
    }

    const status = await git.getStatus();
    const items: TreeItem[] = [];

    items.push(createBranchItem(status));

    const pushPullText = buildPushPullText(status);
    if (pushPullText) {
      items.push(
        new SidebarButton("Push / Pull", "easygit.quickPush", pushPullText)
      );
    }

    items.push(
      new SidebarButton("Commit All", "easygit.quickCommitAll"),
      new SidebarButton("Switch Branch", "easygit.branchSwitch")
    );

    items.push(new StatusTreeItem("", "separator"));

    let hasFileSections = false;

    if (status.staged.length > 0) {
      items.push(createSection("Staged Changes", status.staged, true));
      hasFileSections = true;
    }

    if (status.unstaged.length > 0) {
      items.push(createSection("Changes", status.unstaged, false));
      hasFileSections = true;
    }

    if (status.untracked.length > 0) {
      items.push(createSection("Untracked Files", status.untracked, false));
      hasFileSections = true;
    }

    if (!hasFileSections) {
      items.push(new StatusTreeItem("No changes", "info"));
    }

    items.push(new StatusTreeItem("", "separator"));

    items.push(
      new SidebarButton("Stash Changes", "easygit.stashChanges"),
      new SidebarButton("Undo Last Commit", "easygit.undoLastCommit")
    );

    return items;
  }
}

function createBranchItem(status: GitStatus): StatusTreeItem {
  const aheadBehind =
    status.ahead > 0 || status.behind > 0
      ? `  ↑${status.ahead} ↓${status.behind}`
      : "";
  const item = new StatusTreeItem(
    status.currentBranch,
    "branch"
  );
  item.iconPath = new vscode.ThemeIcon("git-branch");
  item.description = aheadBehind.trim() || "";
  item.command = {
    command: "easygit.branchSwitch",
    title: "Switch Branch",
  };
  item.tooltip = "Current branch. Click to switch.";
  return item;
}

function buildPushPullText(status: GitStatus): string {
  const parts: string[] = [];
  if (status.ahead > 0) parts.push(`↑${status.ahead}`);
  if (status.behind > 0) parts.push(`↓${status.behind}`);
  return parts.join(" ") || "";
}

export class StatusTreeItem extends vscode.TreeItem {
  children?: StatusTreeItem[];

  constructor(
    public readonly label: string,
    public readonly fileType: string
  ) {
    super(label);
    if (fileType === "header") {
      this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
    }
    if (fileType === "separator") {
      this.tooltip = "";
      this.description = "";
    }
    if (fileType === "branch") {
      this.description = "";
    }
  }
}

class SidebarButton extends StatusTreeItem {
  constructor(label: string, cmd: string, description?: string) {
    super(label, "button");
    this.command = { command: cmd, title: label };
    this.tooltip = label;
    this.iconPath = getButtonIcon(label);
    if (description) {
      this.description = description;
    }
  }
}

function getButtonIcon(label: string): vscode.ThemeIcon {
  if (label.includes("Commit")) {
    return new vscode.ThemeIcon("check");
  }
  if (label.includes("Switch")) {
    return new vscode.ThemeIcon("git-branch");
  }
  if (label.includes("Stash")) {
    return new vscode.ThemeIcon("archive");
  }
  if (label.includes("Undo")) {
    return new vscode.ThemeIcon("discard");
  }
  return new vscode.ThemeIcon("arrow-up");
}

function createSection(
  title: string,
  files: FileChange[],
  isStaged: boolean
): StatusTreeItem {
  const section = new StatusTreeItem(
    `${title} (${files.length})`,
    "header"
  );
  section.children = files.map((file) => toTreeItem(file, isStaged));
  return section;
}

function toTreeItem(file: FileChange, isStaged: boolean): StatusTreeItem {
  const icons: Record<string, string> = {
    added: "diff-added",
    modified: "diff-modified",
    deleted: "diff-removed",
    renamed: "diff-renamed",
    untracked: "diff-ignored",
  };

  const item = new StatusTreeItem(file.path, file.status);
  item.iconPath = new vscode.ThemeIcon(icons[file.status] || "file");
  item.contextValue = isStaged ? "stagedFile" : "unstagedFile";

  const commands: vscode.Command[] = isStaged
    ? [
        {
          command: "easygit.unstageFile",
          title: "Unstage",
          arguments: [file.path],
        },
      ]
    : [
        {
          command: "easygit.stageFile",
          title: "Stage",
          arguments: [file.path],
        },
      ];

  item.command = commands[0];
  return item;
}

export function registerSidebar(
  context: vscode.ExtensionContext
): StatusTreeDataProvider {
  const provider = new StatusTreeDataProvider();
  vscode.window.registerTreeDataProvider("easygit-status", provider);

  context.subscriptions.push(
    vscode.commands.registerCommand("easygit.refreshSidebar", () =>
      provider.refresh()
    ),
    vscode.commands.registerCommand("easygit.stageFile", async (filePath: string) => {
      await git.stageFile(filePath);
      provider.refresh();
    }),
    vscode.commands.registerCommand("easygit.unstageFile", async (filePath: string) => {
      await git.unstageFile(filePath);
      provider.refresh();
    })
  );

  return provider;
}
