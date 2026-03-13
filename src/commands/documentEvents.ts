import * as vscode from 'vscode';

export function registerDocumentEvents(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    
    
    const disposable1 = vscode.workspace.onDidOpenTextDocument(document => {
         if (document.uri.scheme !== 'file') return;
        outputChannel.appendLine(`Opened: ${document.fileName}`);
    });

    const disposable2 = vscode.workspace.onDidSaveTextDocument(document => {
        if (document.uri.scheme !== 'file') return;
        outputChannel.appendLine(`Saved: ${document.fileName}`);
    });

    const disposable3 = vscode.workspace.onDidCloseTextDocument(document => {
        if (document.uri.scheme !== 'file') return;
        outputChannel.appendLine(`Closed: ${document.fileName}`);
    });

    const disposable4 = vscode.workspace.onDidChangeTextDocument(event => {
        // event.document — 변경된 문서
        // event.contentChanges — 변경된 내용 배열
        if(event.contentChanges.length === 0) return;
        if (event.document.uri.scheme !== 'file') return;
        
        outputChannel.appendLine(`Changed: ${event.document.fileName}`);
         
    });

    context.subscriptions.push(disposable1);
    context.subscriptions.push(disposable2);
    context.subscriptions.push(disposable3);
    context.subscriptions.push(disposable4);

}