package com.haruon.groupware.application.utils;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import org.jspecify.annotations.Nullable;

import java.time.LocalTime;
import java.util.List;
import java.util.Set;

import static com.haruon.groupware.application.utils.AuthorizationChecker.findActiveEmpById;

public class Utils {

    public static LocalTime getEarlierTime(@Nullable LocalTime targetStartAt, @Nullable LocalTime baseTime) {
        return (targetStartAt == null || (baseTime != null && targetStartAt.isAfter(baseTime) ))? baseTime : targetStartAt;
    }

    public static LocalTime getLaterTime(@Nullable LocalTime targetStartAt, @Nullable LocalTime baseTime) {
        return (targetStartAt == null || (baseTime != null && targetStartAt.isBefore(baseTime)))? baseTime : targetStartAt;
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
