import * as vscode from "vscode";

export function getConfig() {
  const config = vscode.workspace.getConfiguration("onegit");
  return {
    autoFetch: config.get<boolean>("autoFetch", true),
    defaultCommitPrefix: config.get<string>("defaultCommitPrefix", ""),
  };
}
