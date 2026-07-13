import { create } from 'zustand'

interface EmployeeSearchOverlayState {
  isOpen: boolean
  /** 오버레이 상단 검색 input의 값(헤더 input에서 넘겨받은 초기값 이후로는 오버레이가 소유). */
  query: string
  selectedDeptId: number | undefined
  selectedEmpId: number | undefined
}

interface EmployeeSearchOverlayActions {
  /** 헤더 검색 input에서 Enter/검색 아이콘 클릭 시 사용. query를 세팅하며 오버레이를 연다. */
  open: (initialQuery?: string) => void
  close: () => void
  setQuery: (value: string) => void
  /** 조직도에서 부서를 직접 클릭했을 때(검색 결과를 거치지 않은 경우). */
  selectDept: (deptId: number) => void
  /** 검색 결과에서 사원을 클릭했을 때. 좌측 부서 선택도 함께 반영한다(요구사항). */
  selectEmployee: (empId: number, deptId: number) => void
}

/**
 * 헤더 "사원 찾기" 검색 오버레이 UI 상태(chatOverlayStore와 동일한 인앱 풀스크린 오버레이 패턴).
 * LayoutShell 안에서만 소비되므로 새로고침 시 초기화되는 게 자연스러워 영속화하지 않는다
 * (chatOverlayStore와 동일하게 인메모리 전용).
 *
 * //todo : [close() 이후에도 selectedDeptId/selectedEmpId/query를 유지한다(chatOverlayStore의
 * close가 selectedRoomId를 유지하는 것과 동일 컨벤션 — 재오픈 시 마지막 상태를 이어서 보여줌).
 * 반대로 open(initialQuery)은 query만 덮어쓰고 selectedDeptId/selectedEmpId는 그대로 둔다.
 * 재오픈 시 이전 선택을 유지할지, 새 검색으로 간주해 초기화할지는 스펙에 명시되지 않아
 * 사용자 확인이 필요하다]
 */
export const useEmployeeSearchOverlayStore = create<
  EmployeeSearchOverlayState & EmployeeSearchOverlayActions
>((set) => ({
  isOpen: false,
  query: '',
  selectedDeptId: undefined,
  selectedEmpId: undefined,
  open: (initialQuery) => set({ isOpen: true, query: initialQuery ?? '' }),
  close: () => set({ isOpen: false }),
  setQuery: (value) => set({ query: value }),
  selectDept: (deptId) => set({ selectedDeptId: deptId }),
  selectEmployee: (empId, deptId) => set({ selectedEmpId: empId, selectedDeptId: deptId }),
}))
