package com.haruon.groupware.application.schedule.contentFormatter;


public class ScheduleContentFormatter {

    public static String format(ScheduleContentDto dto) {

        return switch (dto) {
            case MeetingScheduleContentDto meeting -> formatMeeting(meeting);
            case BusinessTripScheduleContentDto trip -> formatBusinessTrip(trip);
            case LeaveScheduleContentDto leave -> formatLeave(leave);
            default -> throw new IllegalStateException("지원하지 않는 DTO");
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