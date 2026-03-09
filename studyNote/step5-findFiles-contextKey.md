# Step 5: findFiles & Context Key

## 학습 목표
- `findFiles()`로 현재 존재하는 파일 목록 조회
- Context Key로 커맨드 활성화 상태 제어
- `enablement`로 조건부 커맨드 등록

---

## 핵심 API

### findFiles
```ts
const files = await vscode.workspace.findFiles(
    '**/*.ts',              // include 패턴 (glob)
    '**/node_modules/**'   // exclude 패턴 (null이면 제외 없음)
);
// files: vscode.Uri[]
```
- `FileSystemWatcher`는 **앞으로** 일어나는 변경을 감지
- `findFiles`는 **현재** 존재하는 파일 목록을 조회
- 비동기 함수이므로 `await` 필요

### setContext (Context Key 설정)
```ts
// 상태를 VSCode 컨텍스트에 등록
vscode.commands.executeCommand('setContext', 'my-watcher-test.isWatching', true);
vscode.commands.executeCommand('setContext', 'my-watcher-test.isWatching', false);
```
- VSCode 전역에서 `when` / `enablement` 절에서 참조 가능한 키-값 저장
- `executeCommand('setContext', key, value)` 형식으로 설정

### enablement (package.json)
```json
{
  "command": "my-watcher-test.listFiles",
  "title": "List Watched Files",
  "enablement": "my-watcher-test.isWatching"
}
```
- `enablement` 조건이 `false`이면 커맨드 팔레트에서 회색(비활성) 처리
- Context Key 이름을 조건식으로 사용

---

## 구현 코드

```ts
// listFiles.ts
async function findFiles(outputChannel: vscode.OutputChannel) {
    const config = vscode.workspace.getConfiguration('my-watcher-test');
    const pattern = config.get<string>('globPattern', '**/*.ts');

    const files = await vscode.workspace.findFiles(pattern, '**/node_modules/**');

    if (files.length === 0) {
        outputChannel.appendLine(`No files found for pattern: ${pattern}`);
        return;
    }

    outputChannel.appendLine(`=== Watched files (pattern: ${pattern}) ===`);
    files.forEach(uri => outputChannel.appendLine(uri.fsPath));
    outputChannel.appendLine(`Total: ${files.length} files`);
}
```

```ts
// toggleWatcher.ts
function toggleWatcher(...) {
    if (isActive()) {
        stopWatcher(getCurrentWatcher());
        vscode.commands.executeCommand('setContext', 'my-watcher-test.isWatching', false);
        // ...
    } else {
        startWatcher(outputChannel);
        vscode.commands.executeCommand('setContext', 'my-watcher-test.isWatching', true);
        // ...
    }
}
```

---

## setContext 위치 설계 고려사항

| 위치 | 특징 |
|------|------|
| `fileWatcher.ts` (하위 모듈) | 상태 변경과 항상 동기화됨. 단, 하위 모듈이 UI 관심사(`setContext`)를 직접 처리 |
| `toggleWatcher.ts` (상위 레이어) | 관심사 분리 명확. UI 상태는 UI 레이어에서 관리 |

일반적으로 **상위 레이어(커맨드 핸들러)** 에서 `setContext`를 호출하는 방식을 선호.

---

## findFiles vs FileSystemWatcher 비교

| | `findFiles` | `FileSystemWatcher` |
|--|--|--|
| 용도 | 현재 존재하는 파일 조회 | 파일 변경 실시간 감지 |
| 실행 시점 | 호출 시 1회 | 파일 이벤트 발생마다 |
| 반환 | `Promise<Uri[]>` | 이벤트 리스너 등록 |
| 비동기 | O (`await` 필요) | X (콜백 방식) |
