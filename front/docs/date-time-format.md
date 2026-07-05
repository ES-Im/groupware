## 날짜 / 시간 포맷



- **직렬화는 ISO-8601 로컬 형식이며 타임존 오프셋이 없다** (Jackson 커스텀 없음 → Java Time 기본).
  - `LocalDate` → `"2026-04-01"`
  - `LocalDateTime` → `"2026-03-01T10:00:00"` (끝에 `Z`나 `+09:00` 없음)
  - `LocalTime` → `"09:00:00"`



- **서버 기준 타임존은 Asia/Seoul(KST).** 서버 생성 시각은 `LocalDateTime.now(SEOUL_ZONE)`로 만든다.



- **프론트 주의**: 오프셋이 없으므로 `new Date("2026-03-01T10:00:00")`로 파싱하면 브라우저 로컬 타임존으로 해석된다. 서버 값은 항상 KST이므로 `new Date(문자열)` **금지, dayjs로만 파싱/포맷**하고 KST 고정으로 다룬다. UTC로 오해해 변환하지 말 것.



- 요청 파라미터 날짜도 동일 형식: 날짜 `yyyy-MM-dd`, 연월 `yyyy-MM`(예: `yearMonth=2026-04`), 일시 `yyyy-MM-ddTHH:mm:ss`.

