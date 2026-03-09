import * as vscode from 'vscode';
import { startWatcher, stopWatcher, getCurrentWatcher, isActive } from '../watcher/fileWatcher';

export function registerToggleCommand(context: vscode.ExtensionContext, statusBar: vscode.StatusBarItem, outputChannel: vscode.OutputChannel) {
    const toggleCommand = vscode.commands.registerCommand('my-watcher-test.toggleWatcher', () => toggleWatcher(statusBar, outputChannel));
    context.subscriptions.push(toggleCommand);
}

function toggleWatcher(statusBar: vscode.StatusBarItem, outputChannel: vscode.OutputChannel) {
    if (isActive()) {
        stopWatcher(getCurrentWatcher());
        outputChannel.hide();
        vscode.window.showInformationMessage('Watcher stopped');
        statusBar.text = '$(eye-closed) Watcher OFF';
    } else {
        startWatcher(outputChannel);
        vscode.window.showInformationMessage('Watcher started');
        statusBar.text = '$(eye) Watcher ON';
    }
}
