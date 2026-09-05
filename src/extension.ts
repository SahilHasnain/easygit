import * as vscode from "vscode";
import { git } from "./git/gitService";
import { getConfig } from "./utils/config";
import { registerQuickCommit } from "./commands/quickCommit";
import { registerBranchCommands } from "./commands/branchSwitch";
import { registerPushPullCommands } from "./commands/quickPushPull";
import { registerStashCommands } from "./commands/stash";
import { registerUndoCommit } from "./commands/undoCommit";
import { registerSidebar } from "./views/sidebar";

export function activate(context: vscode.ExtensionContext) {
  const sidebar = registerSidebar(context);

  registerQuickCommit(context);
  registerBranchCommands(context);
  registerPushPullCommands(context);
  registerStashCommands(context);
  registerUndoCommit(context);

  vscode.workspace.onDidSaveTextDocument(() => sidebar.refresh());
  vscode.workspace.onDidDeleteFiles(() => sidebar.refresh());
  vscode.workspace.onDidRenameFiles(() => sidebar.refresh());

  if (getConfig().autoFetch) {
    git.fetch().catch(() => {});
  }
}

export function deactivate() {}
