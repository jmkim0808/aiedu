# 최초 구축 절차

전산팀 없이 담당자 1인이 따라할 수 있도록 순서대로 적는다.
각 단계는 앞 단계가 끝나야 다음으로 넘어간다.

## 0. 준비물

- Cloudflare 계정. **회사 계정으로 만들 것.** 개인 계정으로 만들면 인수인계가 막힌다.
- Node.js 20 이상
- 이 저장소

## 1. 의존성 설치

```bash
npm install
```

설치되는 것은 `wrangler` 하나뿐이다. wrangler 는 Cloudflare 배포 도구다.

## 2. Cloudflare 로그인

```bash
npx wrangler login
```

브라우저가 열리고 권한 승인을 묻는다. 승인하면 터미널로 돌아온다.

## 3. 데이터베이스 생성

```bash
npx wrangler d1 create aiedu
```

출력에 `database_id = "xxxx-xxxx-..."` 가 찍힌다. 이 값을 `wrangler.toml` 의
`database_id` 자리에 붙여넣는다. (현재는 `[확인 필요 — ...]` 자리표시자다.)

```bash
npm run db:remote
```

## 4. 배포와 인증 (중요)

첫 배포는 인증 없이 화면이 뜨는지만 확인한다.

```bash
# wrangler.toml 에서 REQUIRE_ACCESS 를 잠시 "false" 로 바꾼다
npx wrangler deploy
```

화면이 뜨는 것을 확인했으면 **그 자리에서 바로** 다음을 한다.

1. Cloudflare 대시보드 → Zero Trust → Access → Applications → Add an application
2. 이 Worker 의 커스텀 도메인을 대상으로 지정
3. 정책: 허용할 이메일 도메인 지정 (`@powernet.co.kr`, 해외법인 포함 시 각 법인 도메인 추가)
4. Workers 설정에서 **`*.workers.dev` 라우트를 비활성화**한다.
   이걸 빼먹으면 Access 를 우회하는 주소가 열린 채로 남는다.
5. `wrangler.toml` 의 `REQUIRE_ACCESS` 를 `"true"` 로 되돌리고 다시 배포한다.

> 4번과 5번을 빼먹으면 내부 데이터가 인터넷에 열린다. 배포 당일 안에 끝낼 것.

## 5. 역할 매핑 등록

이메일 ↔ 역할 매핑은 소스코드가 아니라 시크릿으로만 관리한다.

```bash
npx wrangler secret put ROLE_MAP
```

값의 형식은 `.dev.vars.example` 을 참고한다. 역할코드는 설계문서의 권한 정의를
반영해 확정한다. 담당자가 바뀌면 이 명령을 다시 실행해 갱신한다.

## 6. 동작 확인

배포 주소를 연다. 둘 다 채워지면 정상이다.

| 확인 항목 | 정상 표시 |
|---|---|
| 시스템 점검 → D1 데이터베이스 | `ok (tables=N)` |
| 내 권한 → 역할 | 본인 역할코드가 표시됨 |

`identity-not-mapped` 가 나오면 5번의 ROLE_MAP 에 본인 이메일이 빠진 것이다.

## 로컬 개발

```bash
cp .dev.vars.example .dev.vars   # 실제 값으로 채운다. 커밋되지 않는다.
npm run db:local
npm run dev                      # http://localhost:8787
```

로컬에는 Access 가 없으므로 `.dev.vars` 의 `REQUIRE_ACCESS=false` 로 쓴다.
운영 배포에는 절대 `false` 를 올리지 않는다.
