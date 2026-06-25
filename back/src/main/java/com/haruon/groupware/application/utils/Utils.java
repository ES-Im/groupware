package com.haruon.groupware.application.utils;

import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.common.EmployeeNotFoundException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.domain.empInfo.Emp;
import org.jspecify.annotations.Nullable;

import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

import static com.haruon.groupware.application.utils.AuthValidator.findActiveEmpById;
import static java.util.Objects.requireNonNull;

public class Utils {

    public static final ZoneId SEOUL_ZONE = ZoneId.of("Asia/Seoul");
    public static final ZoneId ZONE_SEOUL = SEOUL_ZONE;

    public static LocalTime getEarlierTime(
            @Nullable LocalTime targetStartAt,
            @Nullable LocalTime baseTime
    ) {
        if (targetStartAt == null && baseTime == null) {
            throw new RequiredValueMissingException();
        }

        if (targetStartAt == null) {
            return requireNonNull(baseTime);
        }

        if (baseTime == null) {
            return targetStartAt;
        }

        return targetStartAt.isAfter(baseTime)
                ? baseTime
                : targetStartAt;
    }

    public static LocalTime getLaterTime(@Nullable LocalTime targetStartAt, @Nullable LocalTime baseTime) {
        if(targetStartAt == null && baseTime == null) {
            throw new RequiredValueMissingException();
        }

        if(targetStartAt == null) {
            return requireNonNull(baseTime);
        }

        return (baseTime != null && targetStartAt.isBefore(baseTime))
                ? baseTime
                : requireNonNull(targetStartAt);
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
