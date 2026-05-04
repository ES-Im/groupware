package com.haruon.groupware.application.schedule.contentFormatter;

public record BusinessTripScheduleContentDto(
        String businessTripDestination,
        String businessTripPurpose
) implements ScheduleContentDto {
}
