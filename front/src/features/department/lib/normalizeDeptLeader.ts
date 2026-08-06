import type { DeptLeader, DeptLeaderWire } from '../model/deptInfo'

export function normalizeDeptLeader(wire: DeptLeaderWire | null): DeptLeader | null {
  if (wire == null || wire.empId == null || wire.empName == null) {
    return null
  }
  return {
    empId: wire.empId,
    empNo: wire.empNo ?? '',
    empName: wire.empName,
    extensionNo: wire.extensionNo,
    email: wire.email ?? '',
    position: wire.position ?? '',
  }
}
