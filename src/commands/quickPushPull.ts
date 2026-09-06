import * as vscode from "vscode";
import { git } from "../git/gitService";

export function registerPushPullCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("onegit.quickPush", async () => {
      try {
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "OneGit: Pushing...",
          },
          async () => {
            await git.push();
            vscode.window.showInformationMessage("OneGit: Push complete.");
          },
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `OneGit: Push failed — ${error.message}`,
        );
      }
    }),

    vscode.commands.registerCommand("onegit.quickPull", async () => {
      try {
        vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "OneGit: Pulling...",
          },
          async () => {
            await git.pull();
            vscode.window.showInformationMessage("OneGit: Pull complete.");
          },
        );
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `OneGit: Pull failed — ${error.message}`,
        );
      }
    }),
  );
}
