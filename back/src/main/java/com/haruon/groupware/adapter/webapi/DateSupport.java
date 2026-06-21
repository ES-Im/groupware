package com.haruon.groupware.adapter.webapi;

import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.time.YearMonth;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;

public class DateSupport {

    private static LocalDateTime firstDateTimeOfMonth(YearMonth yearMonth) {
        return yearMonth
                .atDay(1)
                .atStartOfDay();
    }

    private static LocalDateTime firstDateTimeOfNextMonth(YearMonth yearMonth) {
        return yearMonth
                .plusMonths(1)
                .atDay(1)
                .atStartOfDay();
    }

    public static SearchPeriod resolveSearchPeriod(@Nullable LocalDateTime start, @Nullable LocalDateTime end) {
        LocalDateTime targetStart = start;
        LocalDateTime targetEnd = end;

        if(start != null && end == null) {
            targetEnd = firstDateTimeOfNextMonth(YearMonth.of(targetStart.getYear(), targetStart.getMonth()));
        }

        if(start == null && end != null) {
            targetStart = firstDateTimeOfMonth(YearMonth.of(targetEnd.getYear(), targetEnd.getMonth()));
        }

        if(start == null && end == null) {
            YearMonth now = YearMonth.now(SEOUL_ZONE);

            targetStart = firstDateTimeOfMonth(now);
            targetEnd = firstDateTimeOfNextMonth(now);
        }

        return new SearchPeriod(targetStart, targetEnd);
    }

    public record SearchPeriod (
            LocalDateTime startDateTime,
            LocalDateTime endDateTime
    ) {}

}
