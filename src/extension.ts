import { ExtensionContext } from "vscode";
import { Container } from "./container";

let container: Container;
export function activate(context: ExtensionContext) {
  context.subscriptions.push((container = new Container(context)));

  // workspace.onDidChangeConfiguration((event) => {
  //   if (event.affectsConfiguration("gitlens")) {
  //     updateStatusBarItem();
  //   }
  // });

  // workspace.onDidChangeWorkspaceFolders(updateStatusBarItem);
  // window.onDidChangeActiveTextEditor(updateStatusBarItem);
}

// export function deactivate() {
//   container?.dispose();
// }
