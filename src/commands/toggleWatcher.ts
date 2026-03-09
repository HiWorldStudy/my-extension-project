import * as vscode from 'vscode';
import { startWatcher, stopWatcher, getCurrentWatcher, isActive } from '../watcher/fileWatcher';

export function registerToggleCommand(context: vscode.ExtensionContext, statusBar: vscode.StatusBarItem, outputChannel: vscode.OutputChannel) {
    const toggleCommand = vscode.commands.registerCommand('my-watcher-test.toggleWatcher', () => toggleWatcher(statusBar, outputChannel));
    context.subscriptions.push(toggleCommand);

    const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('my-watcher-test.globPattern')) {
            // watcher가 켜져 있으면 재시작
            if (isActive()) {
                stopWatcher(getCurrentWatcher());
                startWatcher(outputChannel);
                vscode.window.showInformationMessage('Watcher restarted');
            } 
        }
    });

    context.subscriptions.push(configWatcher);
}

function toggleWatcher(statusBar: vscode.StatusBarItem, outputChannel: vscode.OutputChannel) {
    if (isActive()) {
        stopWatcher(getCurrentWatcher());
        vscode.commands.executeCommand('setContext', 'my-watcher-test.isWatching', false);
        outputChannel.hide();
        vscode.window.showInformationMessage('Watcher stopped');
        statusBar.text = '$(eye-closed) Watcher OFF';
    } else {
        startWatcher(outputChannel);
        vscode.commands.executeCommand('setContext', 'my-watcher-test.isWatching', true);
        vscode.window.showInformationMessage('Watcher started');
        statusBar.text = '$(eye) Watcher ON';
    }
}
