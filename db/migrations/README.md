# 마이그레이션

한 번에 하나씩, 되돌릴 수 있는 단위로 쪼개서 넣는다.

## 파일 이름

```
0001_<무엇을 바꾸는지>.sql
0002_...
```

## 적는 방식

파일 맨 위에 무엇을 왜 바꾸는지 두세 줄로 적고, 맨 아래에 적용 기록을 남긴다.

```sql
-- 0001_create_user.sql
-- 사용자 테이블 추가. 설계문서 <문서명> <절> 반영.

CREATE TABLE ...;

INSERT INTO schema_migration (version) VALUES ('0001');
```

## 적용

```bash
npx wrangler d1 execute aiedu --local  --file=db/migrations/0001_create_user.sql   # 로컬 먼저
npx wrangler d1 execute aiedu --remote --file=db/migrations/0001_create_user.sql   # 확인 후 운영
```

운영에 먼저 적용하지 않는다. 로컬에서 돌려보고 화면까지 확인한 뒤에 올린다.
적용이 끝나면 `db/schema.sql` 에도 같은 내용을 반영해 전체 스키마를 최신으로 유지한다.
