import * as vscode from 'vscode';
import { startWatcher, stopWatcher, getCurrentWatcher, isActive } from '../watcher/fileWatcher';
import { WatchedFilesProvider } from '../ui/watchedFilesProvider';

export function registerToggleCommand(context: vscode.ExtensionContext, statusBar: vscode.StatusBarItem, outputChannel: vscode.OutputChannel, provider : WatchedFilesProvider) {
    const toggleCommand = vscode.commands.registerCommand('my-watcher-test.toggleWatcher', () => toggleWatcher(statusBar, outputChannel, provider));
    context.subscriptions.push(toggleCommand);

    const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('my-watcher-test.globPattern')) {
            // watcher가 켜져 있으면 재시작
            if (isActive()) {
                stopWatcher(getCurrentWatcher());
                startWatcher(outputChannel, () => provider.refresh());
                vscode.window.showInformationMessage('Watcher restarted');
            } 
        }
    });

    context.subscriptions.push(configWatcher);
}

function toggleWatcher(statusBar: vscode.StatusBarItem, outputChannel: vscode.OutputChannel, provider : WatchedFilesProvider) {
    if (isActive()) {
        stopWatcher(getCurrentWatcher());
        provider.refresh();
        vscode.commands.executeCommand('setContext', 'my-watcher-test.isWatching', false);
        outputChannel.hide();
        vscode.window.showInformationMessage('Watcher stopped');
        statusBar.text = '$(eye-closed) Watcher OFF';
    } else {
        startWatcher(outputChannel, () => provider.refresh());
        provider.refresh();
        vscode.commands.executeCommand('setContext', 'my-watcher-test.isWatching', true);
        vscode.window.showInformationMessage('Watcher started');
        statusBar.text = '$(eye) Watcher ON';
    }
}
