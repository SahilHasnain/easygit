import * as vscode from "vscode";
import { git } from "../git/gitService";

export function registerStashCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("onegit.stashChanges", async () => {
      const message = await vscode.window.showInputBox({
        prompt: "Stash message (optional)",
        placeHolder: "WIP: my changes",
      });

      if (message === undefined) {
        return;
      }

      try {
        await git.stash(message || undefined);
        vscode.window.showInformationMessage("OneGit: Changes stashed.");
        vscode.commands.executeCommand("onegit.refreshSidebar");
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `OneGit: Stash failed — ${error.message}`,
        );
      }
    }),

    vscode.commands.registerCommand("onegit.popStash", async () => {
      try {
        await git.popStash();
        vscode.window.showInformationMessage("OneGit: Stash popped.");
        vscode.commands.executeCommand("onegit.refreshSidebar");
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `OneGit: Pop stash failed — ${error.message}`,
        );
      }
    }),
  );
}
