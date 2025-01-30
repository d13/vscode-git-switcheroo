import {
  StatusBarAlignment,
  StatusBarItem,
  window,
  Disposable,
  commands,
  MarkdownString,
} from "vscode";
import { Container } from "./container";
import { getActiveExtension } from "./extension.utils";
import { RefType, Repository } from "./@types/vscode.git";
import { debounce } from "./utils";
import { basename } from "path";

export const SwitchBranchCommand = "gitSwitcheroo.switchBranch";

export class GitSwitcharooStatusItem implements Disposable {
  private _disposables: Disposable[] = [];
  private _item: StatusBarItem | undefined;
  private _repoDisposable: Disposable | undefined;
  private _repo: Repository | undefined;
  private _initialized = false;

  constructor(private readonly container: Container) {
    this._disposables.push(
      container.scm.onInitialized(() => {
        this._initialized = true;
        this.updateRepository();
      })
      // container.scm.onDidOpenRepository(() => {
      //   this.update();
      // }),
      // container.scm.onDidCloseRepository(() => {
      //   this.update();
      // })
    );
  }

  private ensureItem() {
    if (this._item !== undefined) {
      return;
    }

    this._item = window.createStatusBarItem(StatusBarAlignment.Left, 100);
    this.container.context.subscriptions.push(this._item);
  }

  async updateRepository() {
    this._repoDisposable?.dispose();
    this._repo = undefined;

    const repo = await this.container.scm.getBestRepository();
    if (repo === undefined) {
      this.hide();
      return;
    }

    this._repo = repo;
    this._repoDisposable = Disposable.from(
      repo.ui.onDidChange(() => {
        this.updateStatus();
      }),
      repo.state.onDidChange(() => {
        this.updateStatus();
      })
    );

    this.updateStatus();
  }

  private async updateStatusCore() {
    this.ensureItem();
    if (this._item === undefined) {
      return;
    }

    if (!this._initialized) {
      this._item.text = "$(loading~spin) Loading...";
      this._item.tooltip = "Loading branch...";
      this._item.show();
      return;
    }

    const repoState = this.getRepoOverview();
    if (!repoState || repoState.branch === undefined) {
      this._item.text = "$(thumbsdown) Poop, there no branch available";
      this._item.tooltip = undefined;
      this._item.command = undefined;
      this._item.hide();
      return;
    }

    const { branch, refType, hasUpstream, hasChanges, name, upstream } =
      repoState;
    let label = "";

    switch (refType) {
      case RefType.Head: {
        label = `$(git-branch) ${branch}`;
        break;
      }
      case RefType.RemoteHead: {
        label = `$(cloud) ${branch}`;
        break;
      }
      case RefType.Tag: {
        label = `$(tag) ${branch}`;
        break;
      }
      default: {
        label = `$(git-branch) ${branch}`;
        break;
      }
    }

    if (hasChanges) {
      label += "*";
    }

    if (!hasUpstream) {
      label += " (unpublished)";
    }

    this._item.text = label;
    this._item.tooltip = new MarkdownString(
      `Click to Switcheroo\n\n---\n\n${name} - ${branch}${
        hasUpstream ? `, ${upstream}` : " (unpublished)"
      }`
    );
    this._item.command = SwitchBranchCommand;
    this._item.show();
  }

  updateStatus = debounce(this.updateStatusCore.bind(this), 250);

  private getRepoOverview() {
    if (this._repo === undefined || this._repo.state.HEAD === undefined) {
      return undefined;
    }

    const head = this._repo.state.HEAD;
    const hasChanges = [
      this._repo.state.mergeChanges,
      this._repo.state.indexChanges,
      this._repo.state.workingTreeChanges,
      this._repo.state.untrackedChanges,
    ].some((c) => c.length > 0);

    const name = basename(this._repo.rootUri.path);

    let upstream;
    if (head.upstream !== undefined) {
      upstream = `${head.upstream.remote}/${head.upstream.name}`;
    }

    return {
      name,
      branch: head.name,
      refType: head.type,
      hasUpstream: head?.upstream !== undefined,
      upstream,
      hasChanges,
    };
  }

  show() {
    this.ensureItem();
    this._item?.show();
  }

  hide() {
    this._item?.hide();
  }

  dispose() {
    this._disposables.forEach((d) => d.dispose());
    this._item?.dispose();
    this._repoDisposable?.dispose();
  }

  async switchBranchCommand() {
    if ((await getActiveExtension("eamodio.gitlens")) === undefined) {
      return;
    }

    await commands.executeCommand("gitlens.gitCommands.switch");
    // this.updateStatus();
  }

  registerCommands() {
    return [
      commands.registerCommand(
        "gitSwitcheroo.switchBranch",
        this.switchBranchCommand.bind(this)
      ),
    ];
  }
}
