/* 점검 화면. 프레임워크 없이 fetch 만 쓴다 (빌드 단계 없음 원칙). */

function renderDl(el, rows) {
  el.innerHTML = rows
    .map(([k, v]) => `<dt>${k}</dt><dd>${v === null || v === undefined ? '-' : v}</dd>`)
    .join('');
}

function fail(el, e) {
  el.innerHTML = `<dt>오류</dt><dd class="error">${e.message}</dd>`;
}

async function getJson(path) {
  const res = await fetch(path);
  const body = await res.json();
  if (!res.ok) throw new Error(`${res.status} ${body.error || ''}`);
  return body;
}

async function loadHealth() {
  const el = document.getElementById('health');
  try {
    const h = await getJson('/api/health');
    renderDl(el, [
      ['애플리케이션', h.app],
      ['Access 강제', h.require_access],
      ['D1 데이터베이스', h.d1],
    ]);
  } catch (e) { fail(el, e); }
}

async function loadMe() {
  const el = document.getElementById('me');
  try {
    const m = await getJson('/api/me');
    renderDl(el, [
      ['인증', m.authenticated ? '통과' : '미인증'],
      ['역할', m.roles.join(', ') || '없음'],
      ['매핑 상태', m.mapping],
    ]);
  } catch (e) { fail(el, e); }
}

loadHealth();
loadMe();
