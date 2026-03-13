# My Watcher Test

VSCode Extension API 학습 프로젝트. FileSystemWatcher를 중심으로 VSCode Workspace API를 단계별로 학습한다.

## 프로젝트 구조

```
src/
├── extension.ts                  # 진입점 - 초기화 및 등록만 담당
├── commands/
│   ├── toggleWatcher.ts          # watcher ON/OFF 토글 커맨드
│   ├── listFiles.ts              # 파일 목록 조회 커맨드
│   └── documentEvents.ts        # 문서 변화 이벤트 감지
├── ui/
│   ├── statusBar.ts              # StatusBarItem 생성
│   └── watchedFilesProvider.ts  # TreeDataProvider (사이드바 파일 목록)
└── watcher/
    └── fileWatcher.ts            # FileSystemWatcher 생성 및 상태 관리

studyNote/                        # 스텝별 학습 노트 (.md)
```

## 학습한 주요 API

### FileSystemWatcher
- `vscode.workspace.createFileSystemWatcher(globPattern)` — 파일 시스템 변화 감지
- `onDidCreate / onDidChange / onDidDelete` — 생성/변경/삭제 이벤트
- 외부 에디터 변화도 감지 가능 (에디터 내부 이벤트와 차이점)

### OutputChannel
- `vscode.window.createOutputChannel(name)` — 명명된 채널 생성
- `show() / hide()` — 패널 표시/숨김 (`dispose()` 대신 사용)
- `appendLine(text)` — 로그 출력

### StatusBarItem
- `vscode.window.createStatusBarItem(alignment, priority)`
- `text` — codicon 아이콘 포함 가능: `$(eye) Watcher ON`
- `command` — 클릭 시 실행할 커맨드 ID

### Command & Disposable
- `vscode.commands.registerCommand(id, handler)` — 커맨드 등록
- `context.subscriptions.push()` — Extension 종료 시 자동 정리
- 커스텀 Disposable: `{ dispose: () => ... }` — 동적 리소스 정리

### Configuration
- `vscode.workspace.getConfiguration(section).get<T>(key, default)` — 설정값 읽기
- `vscode.workspace.onDidChangeConfiguration(e => { e.affectsConfiguration(key) })` — 변경 감지

### findFiles
- `vscode.workspace.findFiles(include, exclude)` — 현재 존재하는 파일 목록 조회
- `FileSystemWatcher`(미래 변화 감지)와 상호 보완 관계

### Context Key
- `vscode.commands.executeCommand('setContext', key, value)` — VSCode 전역 상태 설정
- `package.json`의 `enablement` / `when` 절에서 참조

### TreeView
- `TreeDataProvider` 인터페이스: `getTreeItem()`, `getChildren()` 구현 필수
- `EventEmitter` + `onDidChangeTreeData` — 트리 갱신 신호
- `refresh()` → `_onDidChangeTreeData.fire()` → VSCode가 `getChildren()` 재호출
- `vscode.window.createTreeView(id, { treeDataProvider })` — 사이드바 뷰 등록

### TreeItem
- `item.command` — 클릭 시 커맨드 실행 (`vscode.open`으로 파일 열기)
- `item.tooltip` — 마우스 오버 툴팁
- `arguments` 배열 — 커맨드 핸들러 파라미터와 1:1 대응

### Document Events
- `onDidOpenTextDocument` — 에디터에서 파일 열릴 때
- `onDidCloseTextDocument` — 파일 닫힐 때
- `onDidSaveTextDocument` — 파일 저장 시
- `onDidChangeTextDocument` — 내용 변경 시 (타이핑마다 발생)
- `uri.scheme === 'file'` 필터링 필수 — output 채널 무한루프 방지

## 주요 설계 원칙

- **관심사 분리**: 하위 모듈(`fileWatcher`)은 UI 레이어를 직접 의존하지 않음. 콜백으로 연결
- **Disposable 패턴**: 모든 리소스는 `context.subscriptions`에 등록
- **모듈 스코프 변수**: `isWatching`, `currentWatcher` — Extension 생명주기 동안 상태 유지
- **동적 리소스**: activate() 시점에 undefined인 리소스는 `{ dispose: () => ref?.dispose() }` 패턴 사용

## 설정 항목 (settings.json)

```json
"my-watcher-test.globPattern": "**/*.ts"
```

## 참고

- 스텝별 상세 학습 내용: `studyNote/step1~8.md`
- Glob 패턴: `**/*.ts` (모든 디렉토리의 .ts 파일), `**/*.{ts,js}` (복수 확장자)
- `uri.fsPath` 사용 권장 (`uri.path`는 URI 표준 형식으로 OS 경로와 다름)
