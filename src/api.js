/**
 * Worker 진입점.
 *
 * 지금 들어있는 것은 도메인 로직이 아니라 "개발을 시작할 수 있는 상태"뿐이다.
 *   - 정적 화면 서빙
 *   - Cloudflare Access 기반 인증 검사
 *   - 이메일 -> 역할코드 해석
 *   - 배포·바인딩이 살아있는지 확인하는 /api/health
 *
 * 설계문서를 반영하면서 라우트를 여기에 추가한다. 도메인 로직이 커지면
 * 기능 단위 모듈(src/*.js)로 분리하고 이 파일은 라우팅만 남긴다.
 *
 * ── 개인정보 취급 규칙 ──────────────────────────────────────────────────────
 * Access 가 붙여주는 이메일은 resolveRoles() 안에서만 쓰이고 즉시 버린다.
 * 응답 본문·로그·D1 어디에도 이메일을 남기지 않는다. 밖으로 나가는 것은 역할코드뿐이다.
 * 이 규칙을 깨는 변경은 개인정보 영향 검토를 먼저 거친다.
 *
 * ── 보안 전제 ───────────────────────────────────────────────────────────────
 * Cf-Access-Authenticated-User-Email 헤더는 Cloudflare Access 가 붙인다.
 * Access 를 통과하지 않는 경로가 열려 있으면 이 헤더를 위조할 수 있다. 따라서 반드시
 *   1) 커스텀 도메인에 Access Application 을 걸 것
 *   2) *.workers.dev 라우트를 비활성화할 것   (SETUP.md 4단계)
 */

const ACCESS_EMAIL_HEADER = 'Cf-Access-Authenticated-User-Email';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), { status, headers: JSON_HEADERS });
}

/**
 * Access 헤더에서 역할코드를 해석한다.
 * 이메일은 이 함수 안에서만 존재하고 반환값에 담지 않는다.
 */
function resolveRoles(request, env) {
  const raw = request.headers.get(ACCESS_EMAIL_HEADER);
  if (!raw) {
    return { authenticated: false, roles: [], mapping: 'no-identity' };
  }
  let map;
  try {
    map = JSON.parse(env.ROLE_MAP || '{}');
  } catch {
    return { authenticated: true, roles: [], mapping: 'role-map-invalid-json' };
  }
  const roles = map[raw.trim().toLowerCase()];
  if (!Array.isArray(roles) || roles.length === 0) {
    return { authenticated: true, roles: [], mapping: 'identity-not-mapped' };
  }
  return { authenticated: true, roles, mapping: 'ok' };
}

/**
 * GET /api/health
 * 배포 직후 D1 바인딩까지 살아있는지 한 번에 확인한다. 인증을 요구하지 않는다.
 * 도메인 테이블이 아직 없으므로 스키마에 의존하지 않는 질의를 쓴다.
 */
async function health(env) {
  let d1 = 'unavailable';
  try {
    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS n FROM sqlite_master WHERE type = 'table'",
    ).first();
    d1 = `ok (tables=${row.n})`;
  } catch (e) {
    d1 = `error: ${e.message}`;
  }
  return json({
    app: env.APP_NAME,
    require_access: env.REQUIRE_ACCESS,
    d1,
  });
}

/**
 * GET /api/me
 * 로그인한 사람이 어떤 역할로 인식되는지 확인한다. 이메일은 반환하지 않는다.
 */
function me(identity) {
  return json({
    authenticated: identity.authenticated,
    roles: identity.roles,
    mapping: identity.mapping,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 정적 파일. 화면 자체는 Access 뒤에 있으므로 여기서 별도 검사를 하지 않는다.
    if (!url.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    // health 는 인증 전에도 연다. 배포가 깨졌는지 확인하는 유일한 통로이기 때문이다.
    if (url.pathname === '/api/health') {
      return health(env);
    }

    const identity = resolveRoles(request, env);
    const requireAccess = String(env.REQUIRE_ACCESS) !== 'false';

    if (requireAccess && !identity.authenticated) {
      return json({ error: 'Cloudflare Access 인증이 필요하다.', mapping: identity.mapping }, 401);
    }
    if (requireAccess && identity.roles.length === 0) {
      return json({ error: '등록되지 않은 사용자다. ROLE_MAP 에 추가해야 한다.', mapping: identity.mapping }, 403);
    }

    switch (url.pathname) {
      case '/api/me':
        return me(identity);
      // 도메인 라우트는 여기에 추가한다.
      default:
        return json({ error: 'not found', path: url.pathname }, 404);
    }
  },
};
