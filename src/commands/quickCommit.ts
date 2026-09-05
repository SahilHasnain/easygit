import * as vscode from "vscode";
import { git } from "../git/gitService";
import { getConfig } from "../utils/config";

export function registerQuickCommit(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("easygit.quickCommit", async () => {
      await quickCommit(false);
    }),
    vscode.commands.registerCommand("easygit.quickCommitAll", async () => {
      await quickCommit(true);
    })
  );
}

async function quickCommit(stageAll: boolean) {
  const status = await git.getStatus();

  if (!status.isDirty) {
    vscode.window.showInformationMessage("easyGit: Nothing to commit.");
    return;
  }

  if (stageAll) {
    await git.stageAll();
  } else if (status.staged.length === 0) {
    const choice = await vscode.window.showQuickPick(
      ["Stage all changes & commit", "Cancel"],
      { placeHolder: "No staged changes. Stage all and commit?" }
    );
    if (choice !== "Stage all changes & commit") {
      return;
    }
    await git.stageAll();
  }

  const config = getConfig();
  const prefix = config.defaultCommitPrefix
    ? `${config.defaultCommitPrefix} `
    : "";

  const message = await vscode.window.showInputBox({
    prompt: "Commit message",
    placeHolder: "Enter commit message...",
    value: prefix,
    validateInput: (val) =>
      val.trim() ? null : "Commit message cannot be empty",
  });

  if (!message) {
    return;
  }

  try {
    const hash = await git.commit(message);
    vscode.window.showInformationMessage(
      `easyGit: Committed ${hash ? hash.substring(0, 7) : ""} — ${message}`
    );
    vscode.commands.executeCommand("easygit.refreshSidebar");
  } catch (error: any) {
    vscode.window.showErrorMessage(`easyGit: Commit failed — ${error.message}`);
  }
}
