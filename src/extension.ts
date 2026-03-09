import * as vscode from 'vscode';
import { registerToggleCommand } from './commands/toggleWatcher';
import { registerListFileCommand } from './commands/listFiles';
import { createStatusBar } from './ui/statusBar';
import { getCurrentWatcher } from './watcher/fileWatcher';

export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "my-watcher-test" is now active!');

	const outputChannel = vscode.window.createOutputChannel('My watcher');
	context.subscriptions.push(outputChannel);

	const statusBar = createStatusBar(context);
	registerToggleCommand(context, statusBar, outputChannel);
	context.subscriptions.push({ dispose: () => getCurrentWatcher()?.dispose() });

	registerListFileCommand(context, outputChannel);
}

export function deactivate() {}
