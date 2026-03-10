# Step 7: TreeItem 클릭 시 파일 열기

## 학습 목표
- `TreeItem.command`로 클릭 이벤트 연결
- `vscode.open` 내장 커맨드로 파일 열기
- `path.basename()`으로 파일명만 표시

---

## 핵심 API

### TreeItem.command

```ts
item.command = {
    command: 'vscode.open',   // 실행할 커맨드 ID
    title: 'Open File',       // 표시 이름 (필수 필드, 접근성/스크린리더용)
    arguments: [uri]          // 커맨드 핸들러에 전달할 파라미터 배열
};
```

- `command`: 커맨드 ID. 내장 커맨드 또는 직접 등록한 커맨드 모두 사용 가능
- `title`: `Command` 인터페이스의 **필수 필드**. `vscode.open`에서는 실질적으로 무시됨
- `arguments`: 커맨드 핸들러 함수의 파라미터와 1:1 대응하는 배열

### arguments 배열과 커맨드 파라미터 관계

```ts
// 커맨드 등록 시
vscode.commands.registerCommand('my.cmd', (a, b, c) => { ... });

// 실행 시 arguments
arguments: [valueA, valueB, valueC]
// → a=valueA, b=valueB, c=valueC
```

### vscode.open 내장 커맨드

```ts
arguments: [
    uri,                      // [0] 열 파일 Uri (필수)
    vscode.ViewColumn.Active, // [1] 에디터 그룹 위치 (선택)
    true                      // [2] 미리보기 모드 여부 (선택)
]
```

**ViewColumn 옵션**

| 값 | 의미 |
|---|---|
| `ViewColumn.One` | 첫 번째 에디터 그룹 |
| `ViewColumn.Active` | 현재 포커스된 그룹 (기본값) |
| `ViewColumn.Beside` | 현재 그룹 옆에 열기 (없으면 새로 생성) |

**에디터 그룹이란?**
VSCode는 화면을 여러 열로 분할해 동시에 여러 파일을 볼 수 있음. `Ctrl+\`로 분할.
```
┌─────────────┬─────────────┐
│  Group 1    │  Group 2    │
│  foo.ts     │  bar.ts     │
└─────────────┴─────────────┘
```

---

### path.basename()

```ts
import * as path from 'path';

path.basename('/src/commands/foo.ts')  // → 'foo.ts'
path.basename('c:\\src\\foo.ts')       // → 'foo.ts'
```

- Node.js 내장 모듈, 별도 설치 불필요
- OS 구분자(/, \\) 모두 처리

---

## 구현 코드

```ts
import * as path from 'path';

return files.map(uri => {
    const item = new vscode.TreeItem(path.basename(uri.fsPath));  // 파일명만 표시
    item.tooltip = uri.fsPath;   // 마우스 오버 시 전체 경로
    item.command = {
        command: 'vscode.open',
        title: 'Open File',
        arguments: [uri]
    };
    return item;
});
```

---

## TreeItem 주요 프로퍼티 정리

| 프로퍼티 | 타입 | 설명 |
|---|---|---|
| `label` | `string` | 트리에 표시되는 텍스트 (생성자 첫 번째 인수) |
| `tooltip` | `string` | 마우스 오버 시 툴팁 |
| `command` | `Command` | 클릭 시 실행할 커맨드 |
| `iconPath` | `ThemeIcon \| Uri` | 아이콘 |
| `collapsibleState` | `TreeItemCollapsibleState` | 자식 노드 접기/펼치기 상태 |
| `contextValue` | `string` | 우클릭 메뉴(when 절) 제어용 식별자 |
