import * as vscode from 'vscode';
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
        return files.map(uri => new vscode.TreeItem(uri.fsPath));
    }

     refresh() {
        this._onDidChangeTreeData.fire();
    }

}
