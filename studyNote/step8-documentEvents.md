# Step 8: 문서 변화 이벤트

## 학습 목표
- `onDidOpenTextDocument` — 파일이 에디터에서 열릴 때
- `onDidCloseTextDocument` — 파일이 닫힐 때
- `onDidSaveTextDocument` — 파일이 저장될 때
- `onDidChangeTextDocument` — 파일 내용이 변경될 때

---

## FileSystemWatcher와의 차이점

| | `FileSystemWatcher` | `onDidChange~TextDocument` |
|--|--|--|
| VSCode에서 편집 | O | O |
| 외부 에디터에서 편집 | **O** | X |
| 터미널/스크립트로 파일 변경 | **O** | X |
| 파일 내용 접근 | X (Uri만) | **O** (`document.getText()`) |
| 감지 수준 | 파일 시스템 | VSCode 에디터 |

두 API는 상호 보완 관계:
- **외부 변화 감지** → `FileSystemWatcher`
- **에디터 내 내용 분석** → `onDidChangeTextDocument`

---

## 핵심 API

### onDidOpenTextDocument
```ts
vscode.workspace.onDidOpenTextDocument(document => {
    outputChannel.appendLine(`Opened: ${document.fileName}`);
});
```

### onDidCloseTextDocument
```ts
vscode.workspace.onDidCloseTextDocument(document => {
    outputChannel.appendLine(`Closed: ${document.fileName}`);
});
```

### onDidSaveTextDocument
```ts
vscode.workspace.onDidSaveTextDocument(document => {
    outputChannel.appendLine(`Saved: ${document.fileName}`);
});
```

### onDidChangeTextDocument
```ts
vscode.workspace.onDidChangeTextDocument(event => {
    // event.document — 변경된 문서
    // event.contentChanges — 변경된 내용 배열 (타이핑마다 발생)
    outputChannel.appendLine(`Changed: ${event.document.fileName}`);
});
```

모두 **Disposable을 반환**하므로 `context.subscriptions.push()` 등록 필요.

---

## 주의사항

### 1. output 채널 무한 루프

`outputChannel.appendLine()` 호출 → output 채널 문서 변경 → `onDidChangeTextDocument` 발생 → 무한 반복

```ts
// scheme으로 output 채널 필터링
if (event.document.uri.scheme !== 'file') return;
```

### 2. Extension 시작 시 자동 열리는 문서들

`onDidOpenTextDocument`는 사용자가 직접 연 파일 외에도 VSCode 내부 문서에도 발생:
- 마지막으로 열었던 파일 자동 복원
- output 채널 문서
- git diff 뷰
- VSCode 내부 채널

```ts
// 실제 파일만 처리
if (document.uri.scheme !== 'file') return;
```

### 3. onDidChangeTextDocument 과다 호출

타이핑할 때마다 호출되므로 로그가 과도하게 찍힐 수 있음.

```ts
// contentChanges가 없으면 무시 (에디터 포커스 변경 등)
if (event.contentChanges.length === 0) return;
```

디바운스로 빈도 제한:
```ts
let debounceTimer: NodeJS.Timeout | undefined;
vscode.workspace.onDidChangeTextDocument(event => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        outputChannel.appendLine(`Changed: ${event.document.fileName}`);
    }, 500);
});
```

---

## uri.scheme 종류

| scheme | 의미 |
|--------|------|
| `file` | 실제 파일 시스템의 파일 |
| `output` | VSCode output 채널 |
| `git` | git diff 뷰 |
| `untitled` | 저장되지 않은 새 파일 |
| `vscode` | VSCode 내부 리소스 |

---

## 구현 코드

```ts
export function registerDocumentEvents(
    context: vscode.ExtensionContext,
    outputChannel: vscode.OutputChannel
) {
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
        if (event.contentChanges.length === 0) return;
        if (event.document.uri.scheme !== 'file') return;
        outputChannel.appendLine(`Changed: ${event.document.fileName}`);
    });

    context.subscriptions.push(disposable1, disposable2, disposable3, disposable4);
}
```
