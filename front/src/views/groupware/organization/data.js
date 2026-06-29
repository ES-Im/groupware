/**
 * 부서/가맹점 더미 데이터 (Dept / Franchise)
 * 실제 연동 시 services/department.js, franchise.js 반환값으로 교체.
 */

// ── 부서 ───────────────────────────────────────────────────
export const departments = [
  { deptId: 1, name: '경영지원본부', leaderName: '박서준', memberCount: 12, active: true },
  { deptId: 2, name: '인사팀', leaderName: '김하루', memberCount: 5, active: true },
  { deptId: 3, name: '개발팀', leaderName: '이온유', memberCount: 14, active: true },
  { deptId: 4, name: '영업팀', leaderName: '박서준', memberCount: 9, active: true },
  { deptId: 5, name: '시설팀', leaderName: '-', memberCount: 3, active: false },
];

// ── 가맹점 ─────────────────────────────────────────────────
// FranchiseStatus
export const FRANCHISE_STATUS_META = {
  OPERATING: { label: '영업중', variant: 'success' },
  PREPARING: { label: '준비중', variant: 'info' },
  SUSPENDED: { label: '영업정지', variant: 'warning' },
  CLOSED: { label: '폐점', variant: 'danger' },
};

// FRANCHISE_LIST
export const franchises = [
  { franchiseId: 1, name: '강남점', managerName: '박서준', region: '서울 강남', status: 'OPERATING', monthlySales: 48000000 },
  { franchiseId: 2, name: '부산서면점', managerName: '이온유', region: '부산 진구', status: 'OPERATING', monthlySales: 36500000 },
  { franchiseId: 3, name: '대전둔산점', managerName: '최민지', region: '대전 서구', status: 'PREPARING', monthlySales: 0 },
  { franchiseId: 4, name: '인천송도점', managerName: '박서준', region: '인천 연수', status: 'SUSPENDED', monthlySales: 12000000 },
  { franchiseId: 5, name: '광주충장점', managerName: '강하늘', region: '광주 동구', status: 'CLOSED', monthlySales: 0 },
];

// FRANCHISE_EDUCATION_CALENDAR / *_LIST
export const educations = [
  { educationId: 1, title: '신규 가맹점주 기본 교육', date: '2026-07-03', capacity: 30, applicants: 18, active: true },
  { educationId: 2, title: '브랜드 매뉴얼 심화 과정', date: '2026-07-10', capacity: 20, applicants: 20, active: true },
  { educationId: 3, title: '위생·안전 관리 교육', date: '2026-07-17', capacity: 40, applicants: 12, active: true },
  { educationId: 4, title: '마케팅 전략 워크숍', date: '2026-06-20', capacity: 25, applicants: 25, active: false },
];

// FRANCHISE_INQUIRY_LIST
export const inquiries = [
  { inquiryId: 1, franchiseName: '강남점', title: '발주 시스템 오류 문의', assignedName: '최민지', answered: false, createdAt: '2026-06-28' },
  { inquiryId: 2, franchiseName: '부산서면점', title: '인테리어 보수 지원 요청', assignedName: '이온유', answered: true, createdAt: '2026-06-25' },
  { inquiryId: 3, franchiseName: '대전둔산점', title: '오픈 일정 협의', assignedName: '-', answered: false, createdAt: '2026-06-27' },
];
