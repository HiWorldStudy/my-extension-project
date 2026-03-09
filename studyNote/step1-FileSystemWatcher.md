# Step 1: FileSystemWatcher 기초

## 학습 목표
- VSCode Extension 활성화 구조 이해
- FileSystemWatcher로 파일 변경 감지
- OutputChannel로 로그 출력

---

## 핵심 API

### activate / deactivate
```ts
export function activate(context: vscode.ExtensionContext) {
    // Extension이 활성화될 때 한 번 실행
}
export function deactivate() {
    // Extension이 비활성화될 때 실행 (생략 가능)
}
```

### activationEvents (package.json)
Extension이 언제 활성화될지 정의.
```json
"activationEvents": ["workspaceContains:**/*.ts"]
```
- 조건들은 **OR** 로 동작 (하나라도 만족하면 활성화)
- VSCode 1.74 이전: 커맨드마다 `onCommand:...` 명시 필요
- VSCode 1.74 이후: `contributes.commands`에 등록된 커맨드는 자동 등록됨

### createFileSystemWatcher
```ts
const watcher = vscode.workspace.createFileSystemWatcher(
    '**/*.ts',     // glob 패턴
    false,         // ignoreCreateEvents
    false,         // ignoreChangeEvents
    false          // ignoreDeleteEvents
);

watcher.onDidCreate((uri) => { /* 파일 생성 */ });
watcher.onDidChange((uri) => { /* 파일 변경 */ });
watcher.onDidDelete((uri) => { /* 파일 삭제 */ });
```

### uri.path vs uri.fsPath
| | `uri.path` | `uri.fsPath` |
|--|--|--|
| 형식 | `/c:/Users/foo/bar.ts` | `c:\Users\foo\bar.ts` |
| 용도 | URI 표준 | OS 네이티브 경로 |
| 권장 | X | **O** (파일 시스템 작업 시) |

### createOutputChannel
```ts
const outputChannel = vscode.window.createOutputChannel('My watcher');
outputChannel.show();                        // 패널 표시
outputChannel.appendLine('Hello');           // 로그 출력
outputChannel.hide();                        // 패널 숨기기
```
- `createOutputChannel`은 Output 패널 내에 **명명된 채널**을 생성
- 채널명으로 다른 Extension 로그와 구분됨

---

## 구현 코드

```ts
export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('My watcher');
    outputChannel.show();

    const watcher = vscode.workspace.createFileSystemWatcher('**/*.ts');
    watcher.onDidCreate((uri) => outputChannel.appendLine(`File ${uri.fsPath} was created!`));
    watcher.onDidChange((uri) => outputChannel.appendLine(`File ${uri.fsPath} was changed!`));
    watcher.onDidDelete((uri) => outputChannel.appendLine(`File ${uri.fsPath} was deleted!`));
}
```

---

## 겪은 문제

**Output 패널 미출력, watcher 동작 없음**
- 원인: `activationEvents`가 비어있어 Extension이 활성화되지 않음
- 해결: `workspaceContains:**/*.ts` 조건 추가, 또는 Ctrl+Shift+P로 커맨드 실행

**로그가 3개씩 출력됨**
- 원인: 토글 시 `startWatcher()`를 중복 호출하여 리스너가 이중 등록됨
- 해결: 중복 호출 제거
