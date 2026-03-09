# Step 3: 역할별 모듈 분리

## 학습 목표
- 관심사 분리(Separation of Concerns) 원칙 적용
- 모듈 스코프 변수 활용
- 파일 구조 설계

---

## 파일 구조

```
src/
├── extension.ts              # 진입점 - 초기화만 담당
├── commands/
│   └── toggleWatcher.ts      # 커맨드 등록 및 토글 로직
├── ui/
│   └── statusBar.ts          # StatusBarItem 생성
└── watcher/
    └── fileWatcher.ts        # FileSystemWatcher 생성 및 상태 관리
```

---

## 모듈 스코프 변수

```ts
// fileWatcher.ts
let isWatching = false;                              // 모듈 스코프 변수
let currentWatcher: vscode.FileSystemWatcher | undefined;

export function isActive() { return isWatching; }
export function getCurrentWatcher() { return currentWatcher; }
```

**모듈 스코프 변수란?**
- 함수 밖, 파일 최상위에 선언된 변수
- 해당 파일(모듈)이 로드되면 초기화되어 **Extension 생명주기 동안 유지**
- 여러 함수에서 공유할 수 있는 상태 저장에 적합
- `class`의 인스턴스 변수와 유사한 역할

---

## 각 모듈의 역할

### extension.ts (진입점)
- 리소스 생성 (`outputChannel`, `statusBar`)
- 각 모듈의 등록 함수 호출
- `context.subscriptions`에 등록

```ts
export function activate(context: vscode.ExtensionContext) {
    const outputChannel = vscode.window.createOutputChannel('My watcher');
    context.subscriptions.push(outputChannel);

    const statusBar = createStatusBar(context);
    registerToggleCommand(context, statusBar, outputChannel);
    context.subscriptions.push({ dispose: () => getCurrentWatcher()?.dispose() });
}
```

### fileWatcher.ts (watcher 로직)
- watcher 생성/해제
- 상태(`isWatching`, `currentWatcher`) 관리

### statusBar.ts (UI)
- `StatusBarItem` 생성 및 초기 설정

### toggleWatcher.ts (커맨드)
- 커맨드 등록
- ON/OFF 토글 로직

---

## 커스텀 Disposable 패턴 심화

```ts
// watcher는 토글 커맨드가 실행되기 전까지 undefined
// 직접 push하면 undefined가 등록되어 의미 없음
context.subscriptions.push(currentWatcher);  // ← 잘못된 방법

// 람다로 감싸면 dispose() 호출 시점에 현재 값을 참조
context.subscriptions.push({ dispose: () => getCurrentWatcher()?.dispose() });
```

`{ dispose: () => ... }` 형태는 VSCode의 `Disposable` 인터페이스를 구현하는 가장 간단한 방법.

---

## outputChannel 관리 전략

watcher ON/OFF와 무관하게 `outputChannel`은 한 번만 생성하고 `show()`/`hide()`로 관리:

```ts
// watcher ON → show()
outputChannel.show();

// watcher OFF → hide() (dispose하지 않음)
outputChannel.hide();
```

- `dispose()`하면 채널이 완전히 제거되어 재생성 필요
- `hide()`는 패널만 숨기고 채널은 유지
