# Git Switcheroo extension for VS Code

> **WARNING**: This is purely a testbed for trying out ideas for VS Code Extensions and should be considered experimental.

This extension creates a replacement for VS Code's Source Control Checkout status bar item. If you use the [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) extension, it will use GitLens to switch branches, giving you better support for Git Worktrees.

## Features

- Custom status bar item that displays the current branch
- Hover with more information about the repo and branch
- Switch branches by clicking on the status bar item

## Installation

1. Install the [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) extension. (optional)
2. Clone this repository.
3. Open the repository in Visual Studio Code.
4. Run `npm install` to install the dependencies.
5. Run `npm run package` to create the extension's VSIX file.
6. Install by opening the Extensions side bar and selecting "Install from VSIX" from the side bar' overflow menu..
