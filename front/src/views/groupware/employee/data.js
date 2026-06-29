/**
 * 사원/근태 더미 데이터
 *
 * 실제 API 연동 시 services/employee.js 의 메서드 반환값으로 교체한다.
 * 필드명은 도메인 모델(DomainGlossary.md: Emp, EmpStatus, PositionCode, Attendance)을 따른다.
 */

// EmpStatus: PENDING | ACTIVE | RESIGNED | SUSPENDED
export const EMP_STATUS_META = {
  ACTIVE: { label: '재직', variant: 'success' },
  PENDING: { label: '승인대기', variant: 'warning' },
  RESIGNED: { label: '퇴직', variant: 'secondary' },
  SUSPENDED: { label: '정직', variant: 'danger' },
};

// PositionCode
export const POSITION_LABEL = {
  INTERN: '인턴',
  STAFF: '사원',
  MANAGER: '매니저',
  DIRECTOR: '이사',
};

// EMPS_FOR_MANAGEMENT 응답 형태(가정)
export const employees = [
  { empId: 1, name: '김하루', deptName: '인사팀', position: 'MANAGER', email: 'haru.kim@haruon.com', phone: '010-1234-5678', status: 'ACTIVE', hiredAt: '2021-03-02' },
  { empId: 2, name: '이온유', deptName: '개발팀', position: 'STAFF', email: 'onyu.lee@haruon.com', phone: '010-2345-6789', status: 'ACTIVE', hiredAt: '2022-07-15' },
  { empId: 3, name: '박서준', deptName: '영업팀', position: 'DIRECTOR', email: 'seojun.park@haruon.com', phone: '010-3456-7890', status: 'ACTIVE', hiredAt: '2019-01-10' },
  { empId: 4, name: '최민지', deptName: '개발팀', position: 'STAFF', email: 'minji.choi@haruon.com', phone: '010-4567-8901', status: 'PENDING', hiredAt: null },
  { empId: 5, name: '정우성', deptName: '시설팀', position: 'INTERN', email: 'woosung.jung@haruon.com', phone: '010-5678-9012', status: 'SUSPENDED', hiredAt: '2023-09-01' },
  { empId: 6, name: '강하늘', deptName: '영업팀', position: 'STAFF', email: 'haneul.kang@haruon.com', phone: '010-6789-0123', status: 'RESIGNED', hiredAt: '2020-05-20' },
];

// RETRIEVE_ME_INFO 응답 형태(가정)
export const myInfo = {
  empId: 1,
  name: '김하루',
  email: 'haru.kim@haruon.com',
  phone: '010-1234-5678',
  deptName: '인사팀',
  position: 'MANAGER',
  status: 'ACTIVE',
  hiredAt: '2021-03-02',
  systemRole: 'HR',
  address: '서울특별시 강남구 테헤란로 123',
  birthDate: '1990-08-15',
};

// AttendanceStatus
export const ATTENDANCE_STATUS_META = {
  NORMAL: { label: '정상근무', variant: 'success' },
  HALF_DAY: { label: '반차', variant: 'info' },
  ANNUAL_LEAVE: { label: '연차', variant: 'primary' },
  SICK_LEAVE: { label: '병가', variant: 'warning' },
  ABSENCE: { label: '결근', variant: 'danger' },
  LATE: { label: '지각/조퇴', variant: 'secondary' },
};

// MY_ATTENDANCE_MONTHLY 응답 형태(가정)
export const myAttendances = [
  { attendanceId: 101, date: '2026-06-01', checkInAt: '08:55', checkOutAt: '18:05', status: 'NORMAL', approved: true },
  { attendanceId: 102, date: '2026-06-02', checkInAt: '09:12', checkOutAt: '18:10', status: 'LATE', approved: true },
  { attendanceId: 103, date: '2026-06-03', checkInAt: '08:50', checkOutAt: '13:00', status: 'HALF_DAY', approved: true },
  { attendanceId: 104, date: '2026-06-04', checkInAt: null, checkOutAt: null, status: 'ANNUAL_LEAVE', approved: true },
  { attendanceId: 105, date: '2026-06-05', checkInAt: '08:58', checkOutAt: '18:02', status: 'NORMAL', approved: false },
];

// MY_ATTENDANCE_MONTHLY_SUMMARY 응답 형태(가정)
export const myAttendanceSummary = {
  yearMonth: '2026-06',
  normalDays: 18,
  annualLeaveDays: 1,
  halfDays: 1,
  lateCount: 1,
  absenceDays: 0,
};
