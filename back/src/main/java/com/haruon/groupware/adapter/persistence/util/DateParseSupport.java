package com.haruon.groupware.adapter.persistence.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;

public class DateParseSupport {

    /**
     * @param yearMonth
     * @return LocalDateTime
     */
    public static LocalDateTime getStartDateTimeByYearMonth(YearMonth yearMonth) {
        return LocalDateTime.of(yearMonth.getYear(), yearMonth.getMonth(), 1, 0, 0, 0);
    }

    public static LocalDateTime getFirstDateTimeOnNextMonth(YearMonth yearMonth) {
        return LocalDateTime.of(yearMonth.getYear(), yearMonth.getMonth(), yearMonth.lengthOfMonth(), 0, 0, 0).plusDays(1);
    }

    /**
     * @param yearMonth
     * @return LocalDate
     */
    public static LocalDate getStartDateByYearMonth(YearMonth yearMonth) {
        return LocalDate.of(yearMonth.getYear(), yearMonth.getMonth(), 1);
    }

    public static LocalDate getFirstDateOnNextMonth(YearMonth yearMonth) {
        return LocalDate.of(yearMonth.getYear(), yearMonth.getMonth(), yearMonth.lengthOfMonth()).plusDays(1);
    }


}
