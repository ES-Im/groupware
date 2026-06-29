/**
 * DEPT API (rules/api-endpoint.md > EMP LEAVE / DEPT API)
 */
import {http} from './http/client';
import {buildQuery} from './http/query';

export const getDepartments = (params) =>
  http.get(`/api/departments${buildQuery(params)}`);
export const getDepartment = (deptId) => http.get(`/api/departments/${deptId}`);
export const getDepartmentMembers = (deptId, params) =>
  http.get(`/api/departments/${deptId}/members${buildQuery(params)}`);

// 부서별 사원 휴가 요약 (DEPT API에 포함)
export const getDeptLeaveSummary = (deptId, params) =>
  http.get(`/api/departments/${deptId}/employees/leaves/summary${buildQuery(params)}`);
export const getDeptLeaveUsageSummary = (deptId, year) =>
  http.get(`/api/departments/${deptId}/employees/leaves/usage-summary${buildQuery({ year })}`);

// ── 관리 (ADMIN) ───────────────────────────────────────────
export const registerDepartment = (body) => http.post('/api/departments', body);
export const activateDepartment = (deptId) =>
  http.patch(`/api/departments/${deptId}/activation`);
export const deactivateDepartment = (deptId) =>
  http.patch(`/api/departments/${deptId}/deactivation`);
export const updateDepartmentName = (deptId, newName) =>
  http.patch(`/api/departments/${deptId}/name${buildQuery({ newName })}`);
export const updateDepartmentParent = (deptId, parentDeptId) =>
  http.patch(`/api/departments/${deptId}/parent${buildQuery({ parentDeptId })}`);
export const appointDepartmentLeader = (deptId, params) =>
  http.patch(`/api/departments/${deptId}/leader/appointment${buildQuery(params)}`);
export const endDepartmentLeader = (deptId, endAt) =>
  http.patch(`/api/departments/${deptId}/leader/end${buildQuery({ endAt })}`);
