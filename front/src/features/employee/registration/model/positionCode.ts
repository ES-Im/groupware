export type PositionCode =
  | 'NONE'
  | 'INTERN'
  | 'STAFF'
  | 'SENIOR_STAFF'
  | 'ASSISTANT_MANAGER'
  | 'MANAGER'
  | 'SENIOR_MANAGER'
  | 'DIRECTOR'
  | 'EXECUTIVE'

export const positionLabels: Record<PositionCode, string> = {
  NONE: '미지정',
  INTERN: '인턴',
  STAFF: '사원',
  SENIOR_STAFF: '주임',
  ASSISTANT_MANAGER: '대리',
  MANAGER: '과장',
  SENIOR_MANAGER: '차장',
  DIRECTOR: '부장',
  EXECUTIVE: '임원',
}
