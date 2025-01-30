# Custom Source Control Extension

This extension creates a replacement for VS Code's Source Control Checkout status bar item. It allows you to switch branches by calling the `gitlens.gitCommands.switch` command from the `eamodio.gitlens` extension.

## Features

- Custom status bar item that displays the current branch
- Switch branches using the `gitlens.gitCommands.switch` command

## Installation

1. Install the [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) extension.
2. Clone this repository.
3. Open the repository in Visual Studio Code.
4. Run `npm install` to install the dependencies.
5. Press `F5` to open a new VS Code window with the extension loaded.

## Usage

1. The custom status bar item will display the current branch.
2. Click on the status bar item to switch branches using the `gitlens.gitCommands.switch` command.

## Contributing

If you have any suggestions or improvements, feel free to create an issue or submit a pull request.

## License

This project is licensed under the MIT License.
