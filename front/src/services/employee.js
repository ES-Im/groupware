/**
 * EMP_ACCOUNT / ATTENDANCE / EMP LEAVE API (rules/api-endpoint.md)
 */
import {http} from './http/client';
import {buildQuery} from './http/query';

// ── 계정/정보 ──────────────────────────────────────────────
/** REGISTER — POST /api/employees (공개) */
export const register = (body) => http.post('/api/employees', body);

/** RETRIEVE_EMP_INFO — GET /api/employees/{empId} */
export const getEmployee = (empId) => http.get(`/api/employees/${empId}`);

/** RETRIEVE_ME_INFO — GET /api/employees/me */
export const getMe = () => http.get('/api/employees/me');

/** RETRIEVE_BELONGINGS_INFOS — GET /api/employees/me/belongings */
export const getMyBelongings = () => http.get('/api/employees/me/belongings');

/** RETRIEVE_FILES_INFOS — GET /api/employees/me/files */
export const getMyFiles = () => http.get('/api/employees/me/files');

/** UPDATE_SELF_INFO — PATCH /api/employees/me */
export const updateMe = (body) => http.patch('/api/employees/me', body);

/** EMP_FILE_UPLOAD — PATCH /api/employees/{empId}/files?fileType= (multipart) */
export const uploadMyFile = (empId, fileType, formData) =>
  http.patch(`/api/employees/${empId}/files${buildQuery({ fileType })}`, formData);

/** ACTIVATE_ME_FILE — PATCH /api/employees/me/files/{fileId}/status */
export const toggleMyFileStatus = (fileId) =>
  http.patch(`/api/employees/me/files/${fileId}/status`);

/** EMP_FILE_DELETE — DELETE /api/employees/{empId}/files/{fileId} */
export const deleteMyFile = (empId, fileId) =>
  http.delete(`/api/employees/${empId}/files/${fileId}`);

// ── 관리 (HR / DEPT_MANAGER / ADMIN) ───────────────────────
/** EMPS_FOR_MANAGEMENT — GET /api/employees?deptId=&status=&keyword=&page=&size= */
export const getEmployeesForManagement = (params) =>
  http.get(`/api/employees${buildQuery(params)}`);

/** NEW_EMP_LIST — GET /api/employees/new?page=&size=&keyword= */
export const getNewEmployees = (params) =>
  http.get(`/api/employees/new${buildQuery(params)}`);

/** HR_APPROVE_EMP_REGISTRATION — PATCH /api/employees/{empId}/registration-approval?hiredAt= */
export const approveRegistration = (empId, hiredAt) =>
  http.patch(`/api/employees/${empId}/registration-approval${buildQuery({ hiredAt })}`);

/** HR_RESIGN_EMP — PATCH /api/employees/{empId}/resignation?hiredAt= */
export const resignEmployee = (empId, hiredAt) =>
  http.patch(`/api/employees/${empId}/resignation${buildQuery({ hiredAt })}`);

/** HR_ACTIVATE_EMP — PATCH /api/employees/{empId}/status/activation */
export const activateEmployee = (empId) =>
  http.patch(`/api/employees/${empId}/status/activation`);

/** HR_SUSPEND_EMP — PATCH /api/employees/{empId}/status/suspension */
export const suspendEmployee = (empId) =>
  http.patch(`/api/employees/${empId}/status/suspension`);

/** HR_UPDATE_EMP_INFO — PATCH /api/employees/{empId}/hr-managed-info */
export const updateEmployeeByHr = (empId, body) =>
  http.patch(`/api/employees/${empId}/hr-managed-info`, body);

/** DEPT_MANAGER_UPDATE_EMP_INFO — PATCH /api/employees/{empId}/dept-managed-info */
export const updateEmployeeByDeptManager = (empId, body) =>
  http.patch(`/api/employees/${empId}/dept-managed-info`, body);

/** HR_UPDATE_ONES_FILE_STATUS — PATCH /api/employees/{empId}/files/{fileId}/status?isForActivate= */
export const updateEmployeeFileStatusByHr = (empId, fileId, isForActivate) =>
  http.patch(`/api/employees/${empId}/files/${fileId}/status${buildQuery({ isForActivate })}`);

// ── 근태 (ATTENDANCE) ──────────────────────────────────────
/** MY_ATTENDANCE_MONTHLY — GET /api/employees/attendances/me/monthly?yearMonth=&status=&page=&size= */
export const getMyAttendanceMonthly = (params) =>
  http.get(`/api/employees/attendances/me/monthly${buildQuery(params)}`);

/** MY_ATTENDANCE_MONTHLY_SUMMARY — GET /api/employees/attendances/me/monthly/summary?yearMonth= */
export const getMyAttendanceSummary = (yearMonth) =>
  http.get(`/api/employees/attendances/me/monthly/summary${buildQuery({ yearMonth })}`);

/** MY_ATTENDANCE_CHECK_IN — POST /api/employees/attendances/me/check-in */
export const checkIn = () => http.post('/api/employees/attendances/me/check-in');

/** MY_ATTENDANCE_CHECK_OUT — PATCH /api/employees/attendances/me/check-out */
export const checkOut = () => http.patch('/api/employees/attendances/me/check-out');

/** DEPT_ATTENDANCE_MONTHLY — GET /api/employees/attendances/{deptId}/monthly?... */
export const getDeptAttendanceMonthly = (deptId, params) =>
  http.get(`/api/employees/attendances/${deptId}/monthly${buildQuery(params)}`);

/** DEPT_ATTENDANCE_PENDING — GET /api/employees/attendances/{deptId}/monthly/pending?page=&size= */
export const getDeptAttendancePending = (deptId, params) =>
  http.get(`/api/employees/attendances/${deptId}/monthly/pending${buildQuery(params)}`);

/** DEPT_ATTENDANCE_UPDATE — PATCH /api/employees/attendances/{attendanceId} */
export const updateAttendance = (attendanceId, body) =>
  http.patch(`/api/employees/attendances/${attendanceId}`, body);

/** DEPT_ATTENDANCE_APPROVE — PATCH /api/employees/attendances/{attendanceId}/approval?targetEmpId=&approvedAt= */
export const approveAttendance = (attendanceId, params) =>
  http.patch(`/api/employees/attendances/${attendanceId}/approval${buildQuery(params)}`);

// ── 휴가 요약 (EMP LEAVE) ──────────────────────────────────
/** MY_EMP_LEAVE_SUMMARY — GET /api/employees/me/leaves/summary?year= */
export const getMyLeaveSummary = (year) =>
  http.get(`/api/employees/me/leaves/summary${buildQuery({ year })}`);

/** EMP_LEAVE_SUMMARY — GET /api/employees/leaves/summary?... (ADMIN) */
export const getLeaveSummary = (params) =>
  http.get(`/api/employees/leaves/summary${buildQuery(params)}`);

/** EMP_LEAVE_USAGE_SUMMARY — GET /api/employees/leaves/usage-summary?deptId=&year= (ADMIN) */
export const getLeaveUsageSummary = (params) =>
  http.get(`/api/employees/leaves/usage-summary${buildQuery(params)}`);

/** EMP_LEAVE_ADJUST_SPECIAL_GRANT_DAYS — PATCH /api/employees/{empId}/leaves/special-grant-days?plusMinusDays= */
export const adjustSpecialGrantDays = (empId, plusMinusDays) =>
  http.patch(`/api/employees/${empId}/leaves/special-grant-days${buildQuery({ plusMinusDays })}`);

/** EMP_LEAVE_ADJUST_COMPENSATORY_GRANT_DAYS — PATCH /api/employees/{empId}/leaves/compensatory-grant-days?plusMinusDays= */
export const adjustCompensatoryGrantDays = (empId, plusMinusDays) =>
  http.patch(
    `/api/employees/${empId}/leaves/compensatory-grant-days${buildQuery({ plusMinusDays })}`
  );
