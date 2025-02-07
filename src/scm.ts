import { Disposable, EventEmitter, Uri } from "vscode";
import {
  API as GitScmAPI,
  GitExtension,
  Repository,
  APIState,
} from "./@types/vscode.git";
import { getActiveExtension } from "./extension.utils";

// https://github.com/microsoft/vscode/tree/main/extensions/git

let scmApi: GitScmAPI | undefined;
export async function getScmGitApi() {
  if (scmApi) {
    return scmApi;
  }

  const gitExtension = await getActiveExtension<GitExtension>("vscode.git");
  scmApi = gitExtension?.getAPI(1);

  return scmApi;
}

export interface RepositoryOpenCloseEvent {
  readonly repository: Repository;
}

export class ScmProvider implements Disposable {
  private _disposables: Disposable[] = [];

  private _initialized = false;
  get initialized() {
    return this._initialized;
  }

  private _onInitialized = new EventEmitter<void>();
  get onInitialized() {
    return this._onInitialized.event;
  }
  private _onDidOpenRepository = new EventEmitter<RepositoryOpenCloseEvent>();
  get onDidOpenRepository() {
    return this._onDidOpenRepository.event;
  }
  private _onDidCloseRepository = new EventEmitter<RepositoryOpenCloseEvent>();
  get onDidCloseRepository() {
    return this._onDidCloseRepository.event;
  }

  constructor() {
    this.ensureApi();
  }

  private async ensureApi() {
    const api = await getScmGitApi();
    if (api === undefined) {
      throw new Error("Git extension not available");
    }

    this._initialized = api.state === "initialized";
    if (this._initialized) {
      this._onInitialized.fire();
    } else {
      this._disposables.push(
        api.onDidChangeState((e) => {
          if (e === "initialized") {
            this._initialized = true;
            this._onInitialized.fire();
          }
        })
      );
    }

    this._disposables.push(
      api.onDidCloseRepository((e) =>
        this._onDidCloseRepository.fire({ repository: e })
      ),
      api.onDidOpenRepository((e) =>
        this._onDidOpenRepository.fire({ repository: e })
      )
      // api.onDidPublish(() => {})
    );

    for (const repo of api.repositories) {
      if (repo.ui.selected === false) {
        continue;
      }

      this._onDidOpenRepository.fire({ repository: repo });
    }
  }

  async getBestRepository(): Promise<Repository | undefined> {
    const repos = (await getScmGitApi())?.repositories;
    if (repos === undefined || repos.length === 0) {
      return undefined;
    }

    const currentRepo = repos.find((r) => r.ui.selected);
    if (currentRepo) {
      return currentRepo;
    }

    return repos[0];
  }

  async getCurrentBranchName(): Promise<string | undefined> {
    const repo = await this.getBestRepository();
    return repo?.state.HEAD?.name;
  }

  dispose() {
    this._disposables.forEach((d) => d.dispose());
  }
}

export class ScmProvider2 implements Disposable {
  dispose() {}
}
