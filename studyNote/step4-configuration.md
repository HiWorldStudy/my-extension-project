# Step 4: getConfiguration & onDidChangeConfiguration

## 학습 목표
- `contributes.configuration`으로 설정 항목 등록
- `getConfiguration()`으로 설정값 읽기
- `onDidChangeConfiguration`으로 설정 변경 감지 및 자동 재시작

---

## 핵심 API

### package.json - 설정 스키마 등록
```json
"contributes": {
  "configuration": {
    "title": "My Watcher",
    "properties": {
      "my-watcher-test.globPattern": {
        "type": "string",
        "default": "**/*.ts",
        "description": "Glob pattern to watch"
      }
    }
  }
}
```
- `title`: 설정 UI 섹션 제목
- `properties`: 설정 항목 정의 (키는 `extensionId.settingName` 형식 권장)
- 등록 후 사용자가 settings.json에서 변경 가능

### getConfiguration
```ts
const config = vscode.workspace.getConfiguration('my-watcher-test');
const pattern = config.get<string>('globPattern', '**/*.ts');
//                                                  ↑ 기본값 (설정 없을 때)
```
- `getConfiguration(section)`: 해당 섹션의 설정 객체 반환
- `config.get<T>(key, defaultValue)`: 값 읽기, 없으면 기본값 반환

### onDidChangeConfiguration
```ts
const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('my-watcher-test.globPattern')) {
        // 이 설정이 변경된 경우에만 실행
        if (isActive()) {
            stopWatcher(getCurrentWatcher());
            startWatcher(outputChannel);
        }
    }
});
context.subscriptions.push(configWatcher);  // Disposable 등록 필수
```
- `e.affectsConfiguration(key)`: 해당 키가 변경됐으면 `true`
- 반환값이 `Disposable`이므로 반드시 `subscriptions`에 등록

---

## 구현 코드

```ts
// fileWatcher.ts
export function startWatcher(outputChannel: vscode.OutputChannel) {
    const config = vscode.workspace.getConfiguration('my-watcher-test');
    const pattern = config.get<string>('globPattern', '**/*.ts');

    currentWatcher = vscode.workspace.createFileSystemWatcher(pattern);
    // ...
}
```

```ts
// toggleWatcher.ts
const configWatcher = vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('my-watcher-test.globPattern')) {
        if (isActive()) {
            stopWatcher(getCurrentWatcher());
            startWatcher(outputChannel);
            vscode.window.showInformationMessage('Watcher restarted');
        }
    }
});
context.subscriptions.push(configWatcher);
```

---

## 설계 고려사항

**설정값을 어디서 읽을까?**

| 방식 | 위치 | 장점 | 단점 |
|------|------|------|------|
| `startWatcher()` 내부에서 읽기 | `fileWatcher.ts` | 상태와 설정이 같은 위치 | 함수 시그니처만 보면 설정 의존성 불명확 |
| 파라미터로 전달 | 호출부 | 명시적, 테스트 용이 | 호출부에서 설정을 직접 관리 |

---

## 재시작 시 주의사항

```ts
// 잘못된 코드 - 기존 watcher를 dispose하지 않고 새로 생성
if (isActive()) {
    startWatcher(outputChannel);  // ← 기존 watcher 메모리 누수!
}

// 올바른 코드
if (isActive()) {
    stopWatcher(getCurrentWatcher());  // 먼저 정리
    startWatcher(outputChannel);       // 새로 생성
}
```
