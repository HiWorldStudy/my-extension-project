# Step 6: TreeView

## 학습 목표
- `TreeDataProvider` 인터페이스 구현
- `EventEmitter`로 트리 갱신 신호 전달
- watcher 이벤트와 트리 갱신 연동

---

## 구성 요소

### 1. package.json — 뷰 등록

```json
"contributes": {
  "views": {
    "explorer": [           // 탐색기 사이드바 내부
      {
        "id": "my-watcher-test.watchedFiles",   // createTreeView에서 사용
        "name": "Watched Files"                  // 패널 제목
      }
    ]
  }
}
```

**뷰 위치 옵션**

| 키 | 위치 |
|---|---|
| `"explorer"` | 탐색기 사이드바 내부 |
| `"scm"` | 소스 컨트롤 사이드바 내부 |
| `"myViewContainer"` | 직접 만든 독립 사이드바 |

독립 사이드바를 만들려면 `viewsContainers.activitybar`에 먼저 아이콘을 등록해야 함.

---

### 2. TreeDataProvider 인터페이스

VSCode가 트리를 그리기 위해 호출하는 메서드들의 계약.

```ts
class WatchedFilesProvider implements vscode.TreeDataProvider<vscode.TreeItem> {

    // VSCode와의 계약 이름 — 반드시 이 이름이어야 함
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    // 노드의 표시 정보 반환 (필수)
    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element;
    }

    // 자식 목록 반환 (필수)
    // element가 undefined → 루트 자식들
    // element가 있음 → 해당 노드의 자식들
    async getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
        if (!isActive()) return [];  // watcher OFF면 빈 목록
        const files = await vscode.workspace.findFiles(pattern, exclude);
        return files.map(uri => new vscode.TreeItem(uri.fsPath));
    }
}
```

---

### 3. EventEmitter — 트리 갱신 메커니즘

```ts
// 발사대 (private - 외부에서 fire() 직접 호출 금지)
private _onDidChangeTreeData = new vscode.EventEmitter<void>();

// 안테나 (readonly - VSCode가 구독, fire()는 불가)
readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

refresh() {
    this._onDidChangeTreeData.fire();  // 신호 발사 → VSCode가 getChildren() 재호출
}
```

**왜 두 개로 나누는가?**
- `EventEmitter`: `fire()`와 `event` 모두 가능
- `Event`: 구독만 가능, `fire()` 없음
- 외부에서 임의로 트리를 갱신하지 못하도록 캡슐화

**VSCode가 `onDidChangeTreeData`를 인식하는 이유?**
- `TreeDataProvider` 인터페이스에 해당 이름으로 선언되어 있음
- VSCode 내부에서 `provider.onDidChangeTreeData`를 직접 참조해 구독
- 이름이 다르면 VSCode가 인식하지 못함

---

### 4. createTreeView — 뷰 생성

```ts
const provider = new WatchedFilesProvider();

vscode.window.createTreeView(
    'my-watcher-test.watchedFiles',  // package.json의 views id와 일치
    { treeDataProvider: provider }
);
```

---

### 5. 콜백 방식으로 refresh 연결

`fileWatcher.ts`가 UI(`WatchedFilesProvider`)를 직접 의존하지 않도록 콜백으로 연결.

```ts
// fileWatcher.ts
export function startWatcher(
    outputChannel: vscode.OutputChannel,
    onFileEvent?: () => void   // 파일 이벤트 발생 시 호출
) {
    currentWatcher.onDidCreate((url) => {
        log(outputChannel, 'created')(url);
        onFileEvent?.();
    });
    currentWatcher.onDidDelete((url) => {
        log(outputChannel, 'deleted')(url);
        onFileEvent?.();
    });
}

// toggleWatcher.ts
startWatcher(outputChannel, () => provider.refresh());
```

**콜백 방식의 장점**: 하위 모듈(`fileWatcher`)이 상위 모듈(`WatchedFilesProvider`)을 몰라도 됨 → 관심사 분리 유지

---

## 전체 갱신 흐름

```
watcher ON
  → startWatcher(outputChannel, () => provider.refresh())
  → provider.refresh()  ← 초기 목록 즉시 표시

파일 생성/삭제 감지
  → onFileEvent?.() 호출
  → provider.refresh()
  → _onDidChangeTreeData.fire()
  → VSCode가 getChildren() 재호출
  → findFiles()로 최신 목록 반환
  → 트리 자동 갱신

watcher OFF
  → stopWatcher()
  → provider.refresh()
  → getChildren() → isActive() false → [] → 트리 비워짐

설정 변경 (globPattern)
  → stopWatcher() → startWatcher(outputChannel, () => provider.refresh())
  → refresh 콜백도 새로 연결됨
```

---

## TreeItem 주요 옵션

```ts
const item = new vscode.TreeItem(
    'foo.ts',                              // 레이블
    vscode.TreeItemCollapsibleState.None   // 자식 없음
);
item.tooltip = '/path/to/foo.ts';         // 마우스 오버 툴팁
item.iconPath = new vscode.ThemeIcon('file');  // 아이콘
item.command = {                          // 클릭 시 커맨드 실행
    command: 'vscode.open',
    title: 'Open',
    arguments: [uri]
};
```

`TreeItemCollapsibleState`
- `None` — 리프 노드 (자식 없음)
- `Collapsed` — 자식 있음, 접혀있음
- `Expanded` — 자식 있음, 펼쳐있음
