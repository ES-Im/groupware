package com.haruon.groupware.application.utils;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Dept;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.EmpBelongings;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;
import org.jspecify.annotations.Nullable;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.springframework.util.Assert.state;

public class Utils {

    public static LocalTime getEarlierTime(@Nullable LocalTime targetStartAt, @Nullable LocalTime baseTime) {
        return (targetStartAt == null || (baseTime != null && targetStartAt.isAfter(baseTime) ))? baseTime : targetStartAt;
    }

    public static LocalTime getLaterTime(@Nullable LocalTime targetStartAt, @Nullable LocalTime baseTime) {
        return (targetStartAt == null || (baseTime != null && targetStartAt.isBefore(baseTime)))? baseTime : targetStartAt;
    }

    public static Emp findActiveEmpById(EmpRepository empRepository, Long id) {
        return empRepository
                .findById(id)
                .filter(e -> e.getStatus().equals(EmpStatus.ACTIVE))
                .orElseThrow(() ->
                new IllegalArgumentException("해당 활성화된 사원이 존재하지 않음")  // to-do 커스텀 예외처리
        );
    }

    public static Emp findAdminEmpById(EmpRepository empRepository, Long id) {
        return empRepository.findById(id)
                .filter(Emp::isAdmin)
                .orElseThrow(() -> new IllegalArgumentException("ADMIN이 아님"));
    }

    public static void checkAdminById(EmpRepository empRepository, Long id) {
        Emp empById = findActiveEmpById(empRepository, id);

        state(empById.isAdmin(), "권한이 없습니다");
    }

    public static Map<String, Emp> checkDeptManagerById(
            EmpRepository empRepository, Long managerId, Long editTargetId
    ) {
        Emp deptManager = findActiveEmpById(empRepository, managerId);
        Emp editTarget = findActiveEmpById(empRepository, editTargetId);

        Set<Dept> managerDept = getCurrentDept(deptManager);
        Set<Dept> targetEmpDept = getCurrentDept(editTarget);

        validateSameDept(managerDept, targetEmpDept);
        state(deptManager.isDeptManager(), "부서 매니저가 아님");

        return new HashMap<>(
                Map.of(
                        "manager", deptManager,
                        "targetEmp", editTarget
                )
        );
    }

    private static Set<Dept> getCurrentDept(Emp emp) {
        return emp.getEmpBelongings().stream()
                .filter(b -> b.getEndAt() == null)
                .map(EmpBelongings::getDept)
                .collect(Collectors.toSet());
    }

    private static void validateSameDept(Set<Dept> managerDept, Set<Dept> targetEmpDept) {
        boolean isSameDept = false;
        for (Dept dept : managerDept) {
            isSameDept = targetEmpDept.contains(dept);
            break;
        }

        state(isSameDept, "부서 매니저의 부서가 수정대상 사원과 다른 부서");
    }

    public static void checkDeptById(EmpRepository empRepository, Long id) {
        Emp empById = findActiveEmpById(empRepository, id);

        state(empById.isDeptManager(), "권한이 없습니다");
    }

    public static Emp findEmpById(EmpRepository empRepository, Long id) {
        return empRepository
                .findById(id)
                .orElseThrow(() ->
                new IllegalArgumentException("해당 사원이 존재하지 않음")  // to-do 커스텀 예외처리
        );
    }

    public static List<Emp> getEmpListById(EmpRepository empRepository, Set<Long> participantEmpIds) {
        return participantEmpIds.stream()
                .map(empId -> findActiveEmpById(empRepository, empId))
                .toList();
    }

}
