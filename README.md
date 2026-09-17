# AIEDU

개발 환경 뼈대. **아직 도메인 기능이 없다.**

무엇을 만들지는 `srlee0808project/powernet` 의 설계문서에 있다. 그 문서를
`docs/design/` 으로 옮긴 뒤 개발을 시작한다. 이 저장소는 그 코드와 이력을
독립적으로 관리하기 위해 새로 만든 것이며, 원본 저장소의 내용을 포크하거나
복사해 오지 않았다.

## 지금 들어있는 것

| 구분 | 상태 |
|---|---|
| 배포 파이프라인 (Cloudflare Workers) | 준비됨 |
| 데이터베이스 바인딩 (D1) | 준비됨. 도메인 테이블은 없음 |
| 인증 (Cloudflare Access + 역할 해석) | 준비됨. 역할코드는 설계 반영 후 확정 |
| 점검 화면 | 준비됨. 실제 화면으로 교체 예정 |
| 도메인 로직 · 데이터 모델 | **없음** |

## 기술 선택과 그 이유

| 구성요소 | 선택 | 이유 |
|---|---|---|
| 실행 환경 | Cloudflare Workers | 사내 전산팀이 없다. 서버·OS·패치 관리가 필요 없는 구조여야 한다. |
| 데이터베이스 | Cloudflare D1 (SQLite) | 별도 DB 서버 없이 Workers 에 바인딩으로 붙는다. |
| 파일 저장 | Cloudflare R2 | 필요해질 때만 켠다. 지금은 비활성화 상태다. |
| 인증 | Cloudflare Access | 자체 로그인을 만들지 않는다. 계정·MFA·감사로그를 Cloudflare 가 맡는다. |
| 프론트엔드 | 순수 HTML/CSS/JS | 빌드 단계를 만들지 않는다. 의존성은 wrangler 하나뿐이다. |

기존 `powernet-esg`(ESG 데이터 입력플랫폼)와 같은 구성이다. 운영·인수인계 부담을
줄이기 위해 의도적으로 맞췄다. 설계문서가 다른 스택을 전제하고 있다면 개발 착수 전에
여기를 먼저 바꾼다.

### 비용 (2026년 9월 기준 개략)

- Workers / D1 / R2 모두 무료 티어 범위에서 시작할 수 있다.
- 사용량이 늘면 Workers Paid 플랜 월 $5 수준부터다.
- Cloudflare Access 는 50명까지 무료, 초과 시 사용자당 월 $3 수준이다.
- **실제 청구액은 계약 시점에 재확인할 것.** 위는 설계 판단용 개략치다.

## 시작하기

`SETUP.md` 를 따른다.

```bash
npm install
cp .dev.vars.example .dev.vars   # 값을 채운다
npm run db:local                 # 로컬 D1 초기화
npm run dev                      # http://localhost:8787
```

## 디렉터리

```
src/api.js          Worker 진입점 — 라우팅 · 인증 · /api/health
public/             정적 화면 (빌드 없음)
db/schema.sql       현재 전체 스키마
db/migrations/      변경 단위 SQL
docs/design/        설계문서 (비어 있음 — 원본에서 옮겨올 것)
```
