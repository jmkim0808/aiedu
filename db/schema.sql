-- 데이터베이스 스키마 (Cloudflare D1 / SQLite)
--
-- 도메인 테이블은 아직 없다. 설계문서를 반영하면서 db/migrations/ 에 파일을 추가하고,
-- 확정된 결과를 이 파일에 합쳐 유지한다. (이 파일이 항상 "현재 전체 스키마"다)
--
-- 스키마를 추가할 때 지키는 규칙
--   1) 개인 식별은 사번으로 한다. 이메일·성명을 이 DB에 저장하지 않는다.
--      이메일 ↔ 역할 매핑은 ROLE_MAP 시크릿에만 둔다.
--   2) 3법인(HQ 본사 / SY 심양 / VP 빈푹)을 다루는 테이블은 entity_code 컬럼을 둔다.
--      법인별로 테이블을 나누지 않는다.
--   3) 운영 중 바뀌는 기준값(임계치·정책·계수)은 코드가 아니라 테이블 컬럼으로 노출한다.
--      담당자가 화면에서 바꿀 수 있어야 한다.

CREATE TABLE IF NOT EXISTS schema_migration (
  version    TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
