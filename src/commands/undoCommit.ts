import * as vscode from "vscode";
import { git } from "../git/gitService";

export function registerUndoCommit(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("onegit.undoLastCommit", async () => {
      const log = await git.getLog(1);

      if (log.length === 0) {
        vscode.window.showInformationMessage("OneGit: No commits to undo.");
        return;
      }

      const lastCommit = log[0];
      const choice = await vscode.window.showWarningMessage(
        `Undo last commit "${lastCommit.message}"? Changes will be kept staged.`,
        { modal: true },
        "Undo Commit",
      );

      if (choice === "Undo Commit") {
        try {
          await git.undoLastCommit();
          vscode.window.showInformationMessage(
            `OneGit: Undid commit ${lastCommit.hash} — changes are now staged.`,
          );
          vscode.commands.executeCommand("onegit.refreshSidebar");
        } catch (error: any) {
          vscode.window.showErrorMessage(
            `OneGit: Undo failed — ${error.message}`,
          );
        }
      }
    }),
  );
}
