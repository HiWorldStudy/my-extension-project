import * as vscode from 'vscode';

export function registerListFileCommand(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    const toggleCommand = vscode.commands.registerCommand('my-watcher-test.listFiles', () => findFiles(outputChannel));
    context.subscriptions.push(toggleCommand);
}

async function  findFiles(outputChannel: vscode.OutputChannel) {

    const config = vscode.workspace.getConfiguration('my-watcher-test');
    const pattern = config.get<string>('globPattern', '**/*.ts');

   const files = await vscode.workspace.findFiles(
    pattern,        // include 패턴
    '**/node_modules/**'  // exclude 패턴 (null이면 제외 없음)
    );

    if(files.length === 0)
    {
        outputChannel.appendLine(`No files found for pattern: ${pattern}`);
        return;
    }

    if (files.length > 0) {
        outputChannel.appendLine(`=== Watched files (pattern: ${pattern}) ===`);
        files.forEach(uri => {
            outputChannel.appendLine(uri.fsPath);
        });

        outputChannel.appendLine(`Total: ${files.length} files`);
    }

    
}