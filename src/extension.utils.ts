import { extensions } from "vscode";

export async function getActiveExtension<T>(
  extensionName: string
): Promise<T | undefined> {
  try {
    const extension = extensions.getExtension<T>(extensionName);
    if (extension === undefined) {
      return undefined;
    }

    return extension.isActive ? extension.exports : await extension.activate();
  } catch {
    return undefined;
  }
}
