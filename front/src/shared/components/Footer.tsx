/**
 * 공통 셸 푸터(순수 시각 요소). 본문(content) 컬럼 폭 안에서만 표시되며 사이드바 영역을 침범하지 않는다
 * (상위 LayoutShell에서 오른쪽 컬럼 하단에 배치). 그 안에서 구성요소는 가운데 정렬한다.
 */
export function Footer() {
  return (
    <footer className="shrink-0 border-t border-border bg-background px-4 py-4 text-center text-sm text-muted-foreground">
      {/*
        정적 회사 정보(ROADMAP T4.3 / PRD §B-3·S5): 회사 정보 조회 기능ID·필드 계약이
        api-endpoint.md 인덱스에 없어 동적 연결이 불가하므로 정적 하드코딩 텍스트를 유지한다
        (API 호출 신규 추가 없음).
      */}
      <p>&copy; {new Date().getFullYear()} 하루온 그룹(HARUON Group). All rights reserved.</p>
    </footer>
  )
}
