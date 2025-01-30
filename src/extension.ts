import { ExtensionContext } from "vscode";
import { Container } from "./container";

let container: Container;
export function activate(context: ExtensionContext) {
  container = new Container(context);

  container.statusBarItem.updateStatus();

  context.subscriptions.push(...container.statusBarItem.registerCommands());

  // workspace.onDidChangeConfiguration((event) => {
  //   if (event.affectsConfiguration("gitlens")) {
  //     updateStatusBarItem();
  //   }
  // });

  // workspace.onDidChangeWorkspaceFolders(updateStatusBarItem);
  // window.onDidChangeActiveTextEditor(updateStatusBarItem);
}

export function deactivate() {
  container?.dispose();
}
