package com.haruon.groupware.application.utils;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.EmployeeNotFoundException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
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
                .orElseThrow(EmployeeNotFoundException::new);
    }

    public static List<Emp> findEmpListById(EmpRepository empRepository, Set<Long> empIds) {
        if(empIds.isEmpty()) throw new RequiredValueMissingException();

        return empIds.stream()
                .map(empId -> findActiveEmpById(empRepository, empId))
                .toList();
    }

}
