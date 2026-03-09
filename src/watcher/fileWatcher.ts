import * as vscode from 'vscode';

let isWatching = false;
let currentWatcher: vscode.FileSystemWatcher | undefined;

export function isActive(): boolean { return isWatching; }
export function getCurrentWatcher(): vscode.FileSystemWatcher | undefined { return currentWatcher; }

const log = (outputChannel: vscode.OutputChannel, event: string) => (url: vscode.Uri) =>
    outputChannel.appendLine(`File ${url.fsPath} was ${event}!`);

export function startWatcher(outputChannel: vscode.OutputChannel): vscode.FileSystemWatcher {
    outputChannel.show();

    const config = vscode.workspace.getConfiguration('my-watcher-test');
    const pattern = config.get<string>('globPattern', '**/*.ts');

    currentWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    currentWatcher.onDidCreate(log(outputChannel, 'created'));
    currentWatcher.onDidChange(log(outputChannel, 'changed'));
    currentWatcher.onDidDelete(log(outputChannel, 'deleted'));

    isWatching = true;
    return currentWatcher;
}

export function stopWatcher(watcher: vscode.FileSystemWatcher | undefined) {
    watcher?.dispose();
    isWatching = false;
}
