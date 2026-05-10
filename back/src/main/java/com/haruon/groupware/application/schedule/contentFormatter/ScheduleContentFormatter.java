package com.haruon.groupware.application.schedule.contentFormatter;


import com.haruon.groupware.application.exception.schedule.UnsupportedScheduleTypeException;

public class ScheduleContentFormatter {

    public static String format(ScheduleContentDto dto) {

        return switch (dto) {
            case MeetingScheduleContentDto meeting -> formatMeeting(meeting);
            case BusinessTripScheduleContentDto trip -> formatBusinessTrip(trip);
            case LeaveScheduleContentDto leave -> formatLeave(leave);
            default -> throw new UnsupportedScheduleTypeException();
        };
    }


    private static String formatMeeting(MeetingScheduleContentDto dto) {
        return String.format(
                "회의실: %s%n회의주제: %s",
                dto.roomName(),
                dto.title()
        );
    }

    private static String formatBusinessTrip(BusinessTripScheduleContentDto dto) {
        return String.format(
                "[출장] %s - %s",
                dto.businessTripDestination(),
                dto.businessTripPurpose()
        );
    }

    private static String formatLeave(LeaveScheduleContentDto dto) {
        return String.format(
                "휴가타입: %s",
                dto.leaveType()
        );
    }

}