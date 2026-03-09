# Step 2: StatusBar, Command, Disposable

## 학습 목표
- StatusBarItem으로 UI 상태 표시
- 커맨드 등록 및 토글 구현
- Disposable 패턴으로 리소스 정리

---

## 핵심 API

### createStatusBarItem
```ts
const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,  // 정렬 위치 (Left / Right)
    100                              // 우선순위 (높을수록 앞에 표시)
);
statusBar.text = '$(eye-closed) Watcher OFF';  // codicon 아이콘 + 텍스트
statusBar.command = 'my-watcher-test.toggleWatcher';  // 클릭 시 실행할 커맨드
statusBar.show();
```

**Codicon 아이콘**: `$(아이콘명)` 형식
- `$(eye)` — 눈 열림
- `$(eye-closed)` — 눈 감김
- [전체 목록](https://code.visualstudio.com/api/references/icons-in-labels)

### registerCommand
```ts
const command = vscode.commands.registerCommand(
    'my-watcher-test.toggleWatcher',  // 커맨드 ID (package.json과 일치해야 함)
    () => { /* 실행 로직 */ }
);
```
- `package.json`의 `contributes.commands`에도 동일한 ID 등록 필요
- Ctrl+Shift+P 커맨드 팔레트에서 `title`로 표시됨

### Disposable 패턴
리소스(watcher, statusBar, command 등)는 Extension 종료 시 반드시 정리해야 함.

```ts
// 방법 1: Disposable을 직접 push
context.subscriptions.push(outputChannel);
context.subscriptions.push(command);

// 방법 2: 커스텀 Disposable (동적 리소스)
context.subscriptions.push({
    dispose: () => getCurrentWatcher()?.dispose()
});
```

**`context.subscriptions`의 역할**
- Extension이 deactivate될 때 등록된 모든 항목의 `dispose()`를 자동 호출
- 리소스 누수 방지

---

## 구현 코드

```ts
export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('My watcher');
    context.subscriptions.push(outputChannel);

    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBar.text = '$(eye-closed) Watcher OFF';
    statusBar.command = 'my-watcher-test.toggleWatcher';
    statusBar.show();
    context.subscriptions.push(statusBar);

    let isWatching = false;
    let watcher: vscode.FileSystemWatcher | undefined;

    const command = vscode.commands.registerCommand('my-watcher-test.toggleWatcher', () => {
        if (isWatching) {
            watcher?.dispose();
            isWatching = false;
            outputChannel.hide();
            statusBar.text = '$(eye-closed) Watcher OFF';
        } else {
            watcher = vscode.workspace.createFileSystemWatcher('**/*.ts');
            watcher.onDidChange((uri) => outputChannel.appendLine(`changed: ${uri.fsPath}`));
            isWatching = true;
            outputChannel.show();
            statusBar.text = '$(eye) Watcher ON';
        }
    });
    context.subscriptions.push(command);
}
```

---

## 겪은 문제

**변수 섀도잉 버그**
```ts
// 잘못된 코드 - else 블록 안에서 let으로 재선언하면 외부 변수가 변경되지 않음
} else {
    let isWatching = true;  // ← 새로운 지역 변수가 생성됨
    let watcher = vscode.workspace.createFileSystemWatcher('**/*.ts');
}
```
- 해결: `let` 제거하고 기존 변수에 할당만 해야 함

**subscriptions.push 위치 오류**
```ts
// 잘못된 코드 - activate() 시점에 watcher가 undefined
context.subscriptions.push(watcher);  // undefined가 push됨

// 올바른 코드 - 커맨드 핸들러 내부에서 push
context.subscriptions.push({ dispose: () => watcher?.dispose() });
```
