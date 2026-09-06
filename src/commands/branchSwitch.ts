import * as vscode from "vscode";
import { git } from "../git/gitService";

export function registerBranchCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("onegit.branchSwitch", async () => {
      try {
        const branches = await git.getBranches();
        const items = branches.map((b) => ({
          label: b.name,
          description: b.isCurrent ? "(current)" : "",
          picked: b.isCurrent,
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: "Select a branch to switch to",
        });

        if (selected && !selected.description) {
          await git.switchBranch(selected.label);
          vscode.window.showInformationMessage(
            `OneGit: Switched to branch "${selected.label}"`,
          );
          vscode.commands.executeCommand("onegit.refreshSidebar");
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `OneGit: Branch switch failed — ${error.message}`,
        );
      }
    }),

    vscode.commands.registerCommand("onegit.createBranch", async () => {
      const name = await vscode.window.showInputBox({
        prompt: "New branch name",
        placeHolder: "feature/my-new-branch",
        validateInput: (val) =>
          val.trim() ? null : "Branch name cannot be empty",
      });

      if (!name) {
        return;
      }

      try {
        await git.createBranch(name);
        vscode.window.showInformationMessage(
          `OneGit: Created and switched to branch "${name}"`,
        );
        vscode.commands.executeCommand("onegit.refreshSidebar");
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `OneGit: Failed to create branch — ${error.message}`,
        );
      }
    }),
  );
}
