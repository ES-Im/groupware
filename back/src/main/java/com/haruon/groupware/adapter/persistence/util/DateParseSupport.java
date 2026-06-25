package com.haruon.groupware.adapter.persistence.util;

import java.time.LocalDate;
import java.time.YearMonth;

public class DateParseSupport {

    public static LocalDate getStartDateByYearMonth(YearMonth yearMonth) {
        return LocalDate.of(yearMonth.getYear(), yearMonth.getMonth(), 1);
    }

    public static LocalDate getFirstDateOnNextMonth(YearMonth yearMonth) {
        return LocalDate.of(yearMonth.getYear(), yearMonth.getMonth(), yearMonth.lengthOfMonth()).plusDays(1);
    }


}
