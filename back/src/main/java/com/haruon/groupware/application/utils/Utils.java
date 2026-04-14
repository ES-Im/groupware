package com.haruon.groupware.application.utils;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.EmpStatus;

import java.time.LocalTime;
import java.util.List;
import java.util.Set;

public class Utils {

    public static LocalTime getEarlierTime(LocalTime targetStartAt, LocalTime baseTime) {
        return (targetStartAt == null || targetStartAt.isAfter(baseTime))? baseTime : targetStartAt;
    }

    public static LocalTime getLaterTime(LocalTime targetStartAt, LocalTime baseTime) {
        return (targetStartAt == null || targetStartAt.isBefore(baseTime))? baseTime : targetStartAt;
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
        Emp empById = findEmpById(empRepository, id);

        if(empById.isAdmin()) throw new IllegalArgumentException("권한이 없습니다");   // to-do 커스텀 예외처리
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
