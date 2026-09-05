import * as vscode from "vscode";
import { git } from "../git/gitService";

export function registerStashCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("easygit.stashChanges", async () => {
      const message = await vscode.window.showInputBox({
        prompt: "Stash message (optional)",
        placeHolder: "WIP: my changes",
      });

      if (message === undefined) {
        return;
      }

      try {
        await git.stash(message || undefined);
        vscode.window.showInformationMessage("easyGit: Changes stashed.");
        vscode.commands.executeCommand("easygit.refreshSidebar");
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `easyGit: Stash failed — ${error.message}`
        );
      }
    }),

    vscode.commands.registerCommand("easygit.popStash", async () => {
      try {
        await git.popStash();
        vscode.window.showInformationMessage("easyGit: Stash popped.");
        vscode.commands.executeCommand("easygit.refreshSidebar");
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `easyGit: Pop stash failed — ${error.message}`
        );
      }
    })
  );
}
