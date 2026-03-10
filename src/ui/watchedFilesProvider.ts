import * as vscode from 'vscode';
import * as path from 'path';
import { isActive } from '../watcher/fileWatcher';

export class WatchedFilesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
    
    // 1. EventEmitter 추가
    private _onDidChangeTreeData = new vscode.EventEmitter<void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    // 트리 아이템의 표시 정보를 반환
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    // 해당 element의 자식 목록을 반환 (null이면 루트 자식들)
    async getChildren(): Promise<vscode.TreeItem[]> {
        if(!isActive())
            return [];

        const config = vscode.workspace.getConfiguration('my-watcher-test');
        const pattern = config.get<string>('globPattern', '**/*.ts');
        const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');
        
        if(files.length === 0)
            return [];

        return files.map(uri => {
            const label = path.basename(uri.fsPath);
            const item = new vscode.TreeItem(label);
            item.command = {
                command: 'vscode.open',    // VSCode 내장 커맨드
                title: 'Open File',
                arguments: [uri]           // 열 파일의 Uri
            };
            item.tooltip = uri.fsPath;    // 마우스 오버 시 전체 경로

            return item;
        });
    }

     refresh() {
        this._onDidChangeTreeData.fire();
    }

}
