/**
 * 쿼리스트링 빌더
 *
 * - null/undefined/'' 값은 자동으로 제외한다 (선택 파라미터가 많은 API 특성 반영).
 * - 값이 하나라도 있으면 '?key=value&...', 없으면 빈 문자열을 반환한다.
 */
export function buildQuery(params) {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    search.append(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}
