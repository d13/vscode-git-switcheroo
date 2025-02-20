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

const SwitchBranchCommand = "gitSwitcheroo.switchBranch";

export class GitSwitcharooStatusController implements Disposable {
  private _disposables: Disposable[] = [];
  private _statusItem: StatusBarItem | undefined;
  private _actionItem: StatusBarItem | undefined;
  private _repoDisposable: Disposable | undefined;
  private _repo: Repository | undefined;
  private _initialized = false;

  private get alignment() {
    return StatusBarAlignment.Left;
  }

  private get priority() {
    return 100;
  }

  constructor(private readonly container: Container) {
    if (container.scm.initialized) {
      this._initialized = true;
      this.updateRepository();
    } else {
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

    this._disposables.push(
      commands.registerCommand(
        SwitchBranchCommand,
        this.switchBranchCommand.bind(this)
      )
    );
  }

  private async updateRepository() {
    this._repoDisposable?.dispose();
    this._repo = undefined;

    const repo = await this.container.scm.getBestRepository();
    if (repo === undefined) {
      this.clearStatus();
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

  private updateStatusCore() {
    this._statusItem ??= window.createStatusBarItem(
      this.alignment,
      this.priority
    );

    if (!this._initialized) {
      this._statusItem.text = "$(loading~spin) Loading...";
      this._statusItem.tooltip = "Loading branch...";
      this._statusItem.show();
      this._actionItem?.hide();
      return;
    }

    const repoState = this.getRepoOverview();
    if (!repoState || repoState.branch === undefined) {
      this._statusItem.text = "$(thumbsdown) Poop, there no branch available";
      this._statusItem.tooltip = undefined;
      this._statusItem.command = undefined;
      this._statusItem.hide();
      this._actionItem?.hide();
      return;
    }

    const { branch, refType, hasUpstream, hasChanges, name, upstream } =
      repoState;
    let statusLabel = "";
    let action: { label: string; action: string; tooltip: string } | undefined;

    switch (refType) {
      case RefType.Head: {
        statusLabel = `$(git-branch) ${branch}`;
        break;
      }
      case RefType.RemoteHead: {
        statusLabel = `$(cloud) ${branch}`;
        break;
      }
      case RefType.Tag: {
        statusLabel = `$(tag) ${branch}`;
        break;
      }
      default: {
        statusLabel = `$(git-branch) ${branch}`;
        break;
      }
    }

    if (hasChanges) {
      statusLabel += "*";
    }

    if (!hasUpstream) {
      statusLabel += " (unpublished)";
      action = {
        label: "$(cloud-upload)",
        action: "git.publish",
        tooltip: `Publish branch ${branch}`,
      };
    } else if (repoState.behind > 0) {
      action = {
        label: "$(cloud-download)",
        action: "git.pull",
        tooltip: `Pull changes from ${upstream}`,
      };
    } else if (repoState.ahead > 0) {
      action = {
        label: "$(cloud-upload)",
        action: "git.push",
        tooltip: `Push changes to ${upstream}`,
      };
    }

    const repoSummaryFootnote = `\n\n---\n\n${name} - ${branch}${
      hasUpstream ? `, ${upstream}` : " (unpublished)"
    }`;

    this._statusItem.text = statusLabel;
    this._statusItem.tooltip = new MarkdownString(
      `Click to Switcheroo${repoSummaryFootnote}`
    );
    this._statusItem.command = SwitchBranchCommand;
    this._statusItem.show();

    if (action) {
      this._actionItem ??= window.createStatusBarItem(
        this.alignment,
        this.priority - 1
      );
      this._actionItem.text = action.label;
      this._actionItem.tooltip = new MarkdownString(
        `${action.tooltip}${repoSummaryFootnote}`
      );
      this._actionItem.command = action.action;
      this._actionItem.show();
    } else {
      this._actionItem?.hide();
    }
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
      ahead: head.ahead ?? 0,
      behind: head.behind ?? 0,
    };
  }

  private clearStatus() {
    this._statusItem?.hide();
    this._actionItem?.hide();
  }

  dispose() {
    this._repoDisposable?.dispose();
    this._actionItem?.dispose();
    this._statusItem?.dispose();
    this._disposables.forEach((d) => d.dispose());
  }

  private _gitLensFound: boolean | undefined;
  private async canUseGitLens() {
    this._gitLensFound ??=
      (await getActiveExtension("eamodio.gitlens")) !== undefined;

    return this._gitLensFound;
  }

  private async switchBranchCommand() {
    // TODO: Use the SCM commands to switch branches if GitLens is not available
    if (!(await this.canUseGitLens())) {
      return;
    }

    await commands.executeCommand("gitlens.gitCommands.switch");
  }
}
