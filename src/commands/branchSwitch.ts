import * as vscode from "vscode";
import { git } from "../git/gitService";

export function registerBranchCommands(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("easygit.branchSwitch", async () => {
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
            `easyGit: Switched to branch "${selected.label}"`
          );
          vscode.commands.executeCommand("easygit.refreshSidebar");
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `easyGit: Branch switch failed — ${error.message}`
        );
      }
    }),

    vscode.commands.registerCommand("easygit.createBranch", async () => {
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
          `easyGit: Created and switched to branch "${name}"`
        );
        vscode.commands.executeCommand("easygit.refreshSidebar");
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `easyGit: Failed to create branch — ${error.message}`
        );
      }
    })
  );
}
