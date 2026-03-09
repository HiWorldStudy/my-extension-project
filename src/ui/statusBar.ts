import * as vscode from 'vscode';

export function createStatusBar(context: vscode.ExtensionContext): vscode.StatusBarItem {
    const statusBar = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    statusBar.show();

    statusBar.text = '$(eye-closed) Watcher OFF';
    statusBar.command = 'my-watcher-test.toggleWatcher';

    context.subscriptions.push(statusBar);
    return statusBar;
}
