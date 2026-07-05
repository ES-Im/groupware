### 페이징 (Spring Data `Page` 표준 구조)



#### 요청 쿼리 파라미너

-  `page`(0-based), `size`. (도메인별로 `keyword`, `status`, `yearMonth` 등 추가 필터)
  - 서버 기본값 관련: `PAGE_SIZE=10`, `PAGE_GROUP_SIZE=10`.



#### **응답 구조 (그대로 파싱):**

```json
{
  "content": [ /* 항목 배열 */ ],
  "pageable": { "pageNumber": 0, "pageSize": 10, "offset": 0, "paged": true, "unpaged": false, "sort": {} },
  "totalElements": 1,
  "totalPages": 1,
  "size": 10,
  "number": 0,
  "numberOfElements": 1,
  "first": true,
  "last": true,
  "empty": false
}
```

- **주의:** `number`**는 0-based 현재 페이지.** UI 페이지 번호(1-based)로 바꿀 때 +1 한다.

