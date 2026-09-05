import * as vscode from "vscode";
import { git } from "../git/gitService";

export function registerUndoCommit(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("easygit.undoLastCommit", async () => {
      const log = await git.getLog(1);

      if (log.length === 0) {
        vscode.window.showInformationMessage("easyGit: No commits to undo.");
        return;
      }

      const lastCommit = log[0];
      const choice = await vscode.window.showWarningMessage(
        `Undo last commit "${lastCommit.message}"? Changes will be kept staged.`,
        { modal: true },
        "Undo Commit"
      );

      if (choice === "Undo Commit") {
        try {
          await git.undoLastCommit();
          vscode.window.showInformationMessage(
            `easyGit: Undid commit ${lastCommit.hash} — changes are now staged.`
          );
          vscode.commands.executeCommand("easygit.refreshSidebar");
        } catch (error: any) {
          vscode.window.showErrorMessage(
            `easyGit: Undo failed — ${error.message}`
          );
        }
      }
    })
  );
}
