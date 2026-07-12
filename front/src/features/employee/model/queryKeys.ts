/**
 * employee 도메인 queryKey 팩토리(ROADMAP T0.3 / §A-3).
 * all을 배열 리터럴로 고정해 무효화(invalidateQueries) 시 employeeKeys.all로 하위 전체를 한 번에 갱신할 수 있게 한다.
 *
 * detail(empId)는 empId가 아직 확정되지 않은 상태(라우트 파라미터 파싱 실패 등)에서도 훅이
 * enabled:false로 대기하며 queryKey를 구성할 수 있도록 number | undefined를 받는다
 * (departmentKeys.members와 동일 컨벤션, ROADMAP T2.2).
 */
export const employeeKeys = {
  all: ['employee'] as const,
  me: () => [...employeeKeys.all, 'me'] as const,
  detail: (empId: number | undefined) => [...employeeKeys.all, 'detail', empId] as const,
  /**
   * 프로필사진/전자서명파일 전체 조회(`RETRIEVE_FILES_INFOS`) 캐시 키.
   * useMeQuery()의 activeFiles(활성만)가 비어있는 예외 상황의 폴백 조회(ROADMAP T5.3)로 시작했지만,
   * RETRIEVE_FILES_INFOS는 비활성 파일도 함께 반환하므로 파일관리 탭(EmpFileManagementPanel)의
   * 활성화/삭제 관리 주 데이터 소스로도 쓰인다. me()와 별도 키로 분리해 서로의 캐시를 오염시키지 않는다.
   */
  filesInfos: () => [...employeeKeys.all, 'filesInfos'] as const,
  /**
   * 관리용 사원 리스트 조회(`EMPS_FOR_MANAGEMENT`) 캐시 키. deptId/status/keyword/page/size가
   * 바뀔 때마다 별도 캐시 엔트리로 구분되도록 params를 그대로 queryKey에 포함한다
   * (departmentKeys.members/list와 동일 컨벤션).
   */
  empsForManagement: (params?: {
    deptId?: number
    status?: string
    keyword?: string
    page?: number
    size?: number
  }) => [...employeeKeys.all, 'empsForManagement', params] as const,
  /**
   * 가입대기자 목록 조회(`NEW_EMP_LIST`) 캐시 키. keyword/page/size가 바뀔 때마다
   * 별도 캐시 엔트리로 구분되도록 params를 그대로 queryKey에 포함한다(empsForManagement와 동일 컨벤션).
   *
   * params 미지정 시 3칸(['employee','newEmployees',undefined])이 아니라 2칸 프리픽스를 반환한다 —
   * invalidateQueries({queryKey: employeeKeys.newEmployees()})가 구체 params를 가진 실제 캐시
   * 쿼리와 partialMatchKey로 매칭되게 하기 위함(scheduleKeys.calendar와 동일 패턴, T6.1 리뷰로 확인됨).
   */
  newEmployees: (params?: { keyword?: string; page?: number; size?: number }) =>
    params === undefined
      ? ([...employeeKeys.all, 'newEmployees'] as const)
      : ([...employeeKeys.all, 'newEmployees', params] as const),
}
