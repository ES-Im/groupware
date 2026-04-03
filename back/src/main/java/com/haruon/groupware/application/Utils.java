package com.haruon.groupware.application;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;

import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static org.springframework.util.Assert.state;

public class Utils {

    public static LocalTime getEarlierTime(LocalTime targetStartAt, LocalTime baseTime) {
        return (targetStartAt == null || targetStartAt.isAfter(baseTime))? baseTime : targetStartAt;
    }

    public static LocalTime getLaterTime(LocalTime targetStartAt, LocalTime baseTime) {
        return (targetStartAt == null || targetStartAt.isBefore(baseTime))? baseTime : targetStartAt;
    }

    public static Emp findEmpById(EmpRepository empRepository, Long id) {
        return empRepository.findById(id).orElseThrow(() ->
                new IllegalArgumentException("해당 사원이 존재하지 않음")  // to-do 커스텀 예외처리
        );
    }

    public static List<Emp> getEmpListById(EmpRepository empRepository, Set<Long> participantEmpIds) {
        return participantEmpIds.stream()
                .map(empId -> findEmpById(empRepository, empId))
                .toList();
    }

    public static Emp getActivateEmp(EmpRepository empRepository, Long empId) {
        Emp emp = findEmpById(empRepository, empId);
        state(emp.getStatus().equals(EmpStatus.ACTIVE), "활성화된 사원이 아닙니다");

        return emp;
    }

}
