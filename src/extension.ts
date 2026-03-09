import * as vscode from 'vscode';

let isWatching = false;
let watcher: vscode.FileSystemWatcher | undefined;

const log = (outputChannel: vscode.OutputChannel, event: string) => (url: vscode.Uri) =>
	outputChannel.appendLine(`File ${url.fsPath} was ${event}!`);

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "my-watcher-test" is now active!');

	const outputChannel = vscode.window.createOutputChannel('My watcher');

	context.subscriptions.push({ dispose: () => watcher?.dispose() });
	context.subscriptions.push(outputChannel);

	const statusBar = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Left,
		100
	);
	statusBar.show();

	statusBar.text = '$(eye-closed) Watcher OFF';
	statusBar.command = 'my-watcher-test.toggleWatcher';

	context.subscriptions.push(statusBar);

	const disposable3 = vscode.commands.registerCommand('my-watcher-test.toggleWatcher', () => toggleWatcher(outputChannel, statusBar));

	context.subscriptions.push(disposable3);
}

function toggleWatcher(outputChannel: vscode.OutputChannel, statusBar: vscode.StatusBarItem) {
	if (isWatching) stopWatcher(outputChannel, statusBar);
	else startWatcher(outputChannel, statusBar);
}

function startWatcher(outputChannel: vscode.OutputChannel, statusBar: vscode.StatusBarItem) {
	outputChannel.show();
	watcher = vscode.workspace.createFileSystemWatcher('**/*.ts');

	watcher.onDidCreate(log(outputChannel, 'created'));
	watcher.onDidChange(log(outputChannel, 'changed'));
	watcher.onDidDelete(log(outputChannel, 'deleted'));

	isWatching = true;
	vscode.window.showInformationMessage('Watcher started');
	statusBar.text = '$(eye) Watcher ON';
}

function stopWatcher(outputChannel: vscode.OutputChannel, statusBar: vscode.StatusBarItem) {
	watcher?.dispose();
	outputChannel.hide();
	isWatching = false;
	vscode.window.showInformationMessage('Watcher stopped');
	statusBar.text = '$(eye-closed) Watcher OFF';
}

export function deactivate() {}
