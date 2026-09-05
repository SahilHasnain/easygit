import * as vscode from "vscode";
import { git } from "../git/gitService";

export function registerPushPullCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("easygit.quickPush", async () => {
      try {
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "easyGit: Pushing...",
          },
          async () => {
            await git.push();
            vscode.window.showInformationMessage("easyGit: Push complete.");
          }
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(`easyGit: Push failed — ${error.message}`);
      }
    }),

    vscode.commands.registerCommand("easygit.quickPull", async () => {
      try {
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "easyGit: Pulling...",
          },
          async () => {
            await git.pull();
            vscode.window.showInformationMessage("easyGit: Pull complete.");
          }
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(`easyGit: Pull failed — ${error.message}`);
      }
    })
  );
}
