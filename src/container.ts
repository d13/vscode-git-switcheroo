import { Disposable, ExtensionContext } from "vscode";
import { ScmProvider } from "./scm";
import { GitSwitcharooStatusController } from "./statusbar";

export class Container implements Disposable {
  private _disposables: Disposable[] = [];

  constructor(private readonly _context: ExtensionContext) {
    this._disposables.push((this._scm = new ScmProvider()));
    this._disposables.push(
      (this._statusBar = new GitSwitcharooStatusController(this))
    );
  }

  get context() {
    return this._context;
  }

  private readonly _scm: ScmProvider;
  get scm() {
    return this._scm;
  }

  private readonly _statusBar: GitSwitcharooStatusController;
  get statusBar() {
    return this._statusBar;
  }

  dispose() {
    this._disposables.forEach((d) => d.dispose());
  }
}
