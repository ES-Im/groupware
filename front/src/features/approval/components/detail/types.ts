import type { DraftDetailResponse } from '../../model/draftDetail'

/**
 * 기안서 상세 슬롯 컴포넌트 공통 props 계약(ROADMAP(DRAFT) M2 T2.3, 병렬 편집 충돌 방지 경계).
 *
 * 상세 페이지는 영역별 슬롯 컴포넌트(`components/detail/*`)로 분리되며, M3(결재자 액션)·M4(기안자
 * 액션)·M5(공람)·M6(첨부)이 각자 자기 슬롯 파일만 편집해 상세 화면에 기능을 얹는다. 슬롯 간
 * props 시그니처를 **`{ draft }` 단일 형태로 고정**해, 이후 슬라이스가 필요한 필드를 draft에서 직접
 * 읽고 자체 훅(mutation·useMeQuery 등)을 슬롯 내부에서 추가하더라도 조립부(DraftDetailPage)·다른
 * 슬롯의 시그니처를 바꾸지 않도록 한다(파일 소유권 분리 = 병렬 작업 시 머지 충돌 최소화).
 */
export interface DraftDetailSectionProps {
  draft: DraftDetailResponse
}
