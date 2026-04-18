# vibecoding

## Anthropic Academy - Claude Code in Action
### 프로젝트 시작하기
- 프로젝트 시작 시 /init 먼저 하기 >> 코드베이스를 스캔하여 CLAUDE.md를 작성함
  - 작성된 CLAUDE.md 확인하기
  - 클로드가 프로젝트를 더 잘 이해하도록 하기 위한 목적도 있지만, 역으로 우리가 클로드에게 가이드라인을 제시해줄 수 있는 수단이기도 함.
  - 레벨
      - Project: /init으로 생성, Git에 커밋하여 관리
      - Local (CLAUDE.local.md): 개인적 지사항 추가
      - Machine (~/.claude/CLAUDE.md): 전체 프로젝트에 적용될 지시사항
- 같은 요청에 대해 지속 허락: Shift + Tab
- 파일 언급: @
    - 클로드에게 방향 제시
- CLAUDE.md 수정: #
    - 메모리에 저장해둘 내용 입력

### 기존 프로젝트 변경
- 이미지 스크린샷(Win + Shift + S)을 Ctrl + V 로 클로드에게 전달 가능
- 복잡한 구현 전 (How To Boost Claude's Intelligence) (*1,2 같이 사용 가능)
  1) Plan Mode (Shift + Tab 2번)
     : 이해의 "폭" - 넓은 범위의 코드를 보거나, 단계적 접근이 필요한 경우
  3) Thinking Mode (extended thinking feature 사용)
     : 이해의 "깊이" - 국한된 범위의 코드를 보거나, 디버깅 시
     - 프롬프트로 "깊게 생각해줘" 따위의 문구 추가하기
       (ex. "This is a tough task, so ultrathink about the best way to implement it.")

### 문맥 통제
- Esc 키로 중단시키기
  - 반복적인 실수를 할 경우에도 사용
    1) 현재 응답에 대해 Esc 로 중지
    2) '#'로 올바른 접근법을 메모리에 저장
    3) 대화 재개
- Esc 키 2번: 이전 특정 대화시점으로 돌아가기
- /compact: 대화 요약
  - 클로드가 현재 일감에 대한 숙지가 충분히 된 경우, 관련된 일감으로 넘어갈 때 사용을 권장
- /clear: 대화 삭제하기
  - 완전히 다른 일감으로 넘어갈 때, 이전 대화내용이 혼선을 야기할 수 있는 경우, 처음부터 다시 할 때

### 커스텀 명령어
- 프로젝트 폴더의 .claude/commands 폴더에 `{명령어}.md` 구조의 파일 생성
- 자연어로 작성하면 됨
- $ARGUMENTS 로 인자 전달도 가능함 (이건 클로드에게 작성시키면 됨)
- 장점
  - 자동화
  - 행위의 동일성 보
  - 문맥 유지
  - 유연성 (인자 활용)
- 활용 방안: 테스트, 코드 배포, 보일러플레이트 생성, 컨벤션

### MCP 서버
*MCP: Model Context Protocol
- 실행 위치: 로컬 또는 원격
- 대표적: Playwright - 웹브라우저 컨트롤
- 권한 허용(되묻기 없음): .claude/settings.local.json의 permissions.allow 배열에 넣어주기

### Github 연결
/install-github-app

### Hook
- 트리거와 유사함: 동작 전/후에 명령어 실행
  - PreToolUse: Tool 실행 전, 동작을 막을 수 있음
  - PostToolUse: Tool 실행 후
  - 툴 이름은 클로드한테 물어보면 
- 설정
  - Global: ~/.claude/settings.json
  - Project: .claude/settings.json
  - Project (not committed): .claude/settings.local.json
- 설계: /hooks
- 용례
  - 코드 포맷팅
  - 테스트 수행
  - 접근권한 관리
  - 코드품질 관리
  - 로그
  - 유효성 검사 (컨벤션)
- 장단점
  - Benefits: Cleaner codebase with less duplication
  - Costs: Additional time and API usage for each query directory edit
  - Recommendation: Only monitor critical directories to minimize overhead
