import { Disposable, ExtensionContext } from "vscode";
import { ScmProvider } from "./scm";
import { GitSwitcharooStatusItem } from "./statusbar";

export class Container implements Disposable {
  private _disposables: Disposable[] = [];

  constructor(private readonly _context: ExtensionContext) {
    this._disposables.push((this._scm = new ScmProvider()));
    this._disposables.push(
      (this._statusBarItem = new GitSwitcharooStatusItem(this))
    );
  }

  get context() {
    return this._context;
  }

  private readonly _scm: ScmProvider;
  get scm() {
    return this._scm;
  }

  private readonly _statusBarItem: GitSwitcharooStatusItem;
  get statusBarItem() {
    return this._statusBarItem;
  }

  dispose() {
    this._disposables.forEach((d) => d.dispose());
  }
}
