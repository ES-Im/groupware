package com.haruon.groupware.domain.meeting;

import com.haruon.groupware.domain.empInfo.Emp;
import lombok.Builder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Stream;

import static com.haruon.groupware.domain.meeting.Meeting.reserve;
import static com.haruon.groupware.domain.meeting.MeetingRoomFixture.getMeetingRoom;
import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MeetingTest {

    @Test
    @DisplayName("회의 예약 테스트")
    void reserveMeeting_success() {
        MeetingRoom room = getMeetingRoom();
        Emp emp  = getApprovedEmp();
        String title = "testTitle";
        LocalDate date = LocalDate.of(2026,3,3);
        LocalTime startTime = LocalTime.of(13,0,0);
        LocalTime endTime = LocalTime.of(14,0,0);
        List<Emp> participants = List.of(getApprovedEmp("202601005", "participant1"), getApprovedEmp("202601006", "participant2"));

        Meeting reserve = reserve(room, emp, title, date, startTime, endTime, participants);

        assertThat(reserve).extracting(
                Meeting::getMeetingRoom, Meeting::getEmp, Meeting::getTitle,
                Meeting::getMeetingDate, Meeting::getStartAt, Meeting::getEndAt
        ).containsExactly(room, emp, title, date, startTime, endTime);

        assertThat(reserve.isCancel()).isFalse();
    }

    private static Stream<Arguments> reserveMeetingArguments() {
        MeetingRoom room = getMeetingRoom();
        Emp emp  = getApprovedEmp();
        String title = "testTitle";
        LocalDate date = LocalDate.of(2026,3,3);
        LocalTime startTime = LocalTime.of(13,0,0);
        LocalTime endTime = LocalTime.of(14,0,0);

        return Stream.of(
                Arguments.of("회의실정보가 없으면 예약 실패",
                        ReserveParam.builder()
                                .meetingRoom(null)
                                .reserver(emp)
                                .title(title)
                                .meetingDate(date)
                                .startAt(startTime)
                                .endAt(endTime)
                        .build()
                ),Arguments.of("예약자 정보가 없으면 예약 실패",
                        ReserveParam.builder()
                                .meetingRoom(room)
                                .reserver(null)
                                .title(title)
                                .meetingDate(date)
                                .startAt(startTime)
                                .endAt(endTime)
                        .build()
                ),Arguments.of("회의 제목이 없으면 예약 실패",
                        ReserveParam.builder()
                                .meetingRoom(room)
                                .reserver(emp)
                                .title(null)
                                .meetingDate(date)
                                .startAt(startTime)
                                .endAt(endTime)
                        .build()
                ),Arguments.of("회의제목이 빈칸이면 예약 실패",
                        ReserveParam.builder()
                                .meetingRoom(room)
                                .reserver(emp)
                                .title("")
                                .meetingDate(date)
                                .startAt(startTime)
                                .endAt(endTime)
                        .build()
                ),Arguments.of("회의일자가 없으면 예약 실패",
                        ReserveParam.builder()
                                .meetingRoom(room)
                                .reserver(emp)
                                .title(title)
                                .meetingDate(null)
                                .startAt(startTime)
                                .endAt(endTime)
                        .build()
                ),Arguments.of("시작시간 없으면 예약 실패",
                        ReserveParam.builder()
                                .meetingRoom(room)
                                .reserver(emp)
                                .title(title)
                                .meetingDate(date)
                                .startAt(null)
                                .endAt(endTime)
                        .build()
                ),Arguments.of("종료시간 없으면 예약 실패",
                        ReserveParam.builder()
                                .meetingRoom(room)
                                .reserver(emp)
                                .title(title)
                                .meetingDate(date)
                                .startAt(startTime)
                                .endAt(null)
                        .build()
                ),Arguments.of("종료시간이 시작시간보다 이르면 예약 실패",
                        ReserveParam.builder()
                                .meetingRoom(room)
                                .reserver(emp)
                                .title(title)
                                .meetingDate(date)
                                .startAt(startTime)
                                .endAt(startTime.minusHours(1))
                        .build()
                )
        );
    }

    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("reserveMeetingArguments")
    @DisplayName("회의 예약 실패케이스")
    void reserve_meeting_fail(String description, ReserveParam param) {
        assertThatThrownBy(() ->
            reserve(
                    param.meetingRoom(),
                    param.reserver(),
                    param.title(),
                    param.meetingDate(),
                    param.startAt(),
                    param.endAt(),
                    param.participantIds
            )
        ).isInstanceOf(Exception.class);
    }


    @Test
    @DisplayName("회의 취소 성공")
    void cancel_reservation() {
        Meeting meeting = getMeeting();

        meeting.cancel();

        assertThat(meeting.isCancel()).isTrue();
    }
    @Test
    @DisplayName("회의 취소 실패")
    void cancel_reservation_fail() {
        Meeting meeting = getMeeting();

        meeting.cancel();
        assertThat(meeting.isCancel()).isTrue();

        assertThatThrownBy(meeting::cancel).isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("회의 일정정보 수정")
    void edit_reservation_time() {
        Meeting meeting = getMeeting();
        LocalDate editedDate = meeting.getMeetingDate().plusDays(1);
        LocalTime editedStartTime = meeting.getStartAt().plusHours(1);
        LocalTime editedEndTime = meeting.getEndAt().plusHours(1);
        MeetingRoom editedMeetingRoom = MeetingRoom.createMeetingRoom("nd", "de", 10);

        String title = meeting.getTitle().concat("new");

        meeting.changeReservation(editedDate, editedStartTime, editedEndTime, editedMeetingRoom, title);

        assertThat(meeting).extracting(
                Meeting::getMeetingDate, Meeting::getStartAt, Meeting::getEndAt, Meeting::getMeetingRoom, Meeting::getTitle
        ).containsExactly(
                editedDate, editedStartTime, editedEndTime, editedMeetingRoom, title
        );
    }

    private static Stream<Arguments> editReservationArguments() {
        Meeting meeting = getMeeting();

        return Stream.of(
                Arguments.of("회의제목이 빈값이라면 수정 실패",
                        ReserveParam.builder()
                                .title(" ")
                        .build()
                ), Arguments.of("종료시각이 시작시간보다 이르면 수정실패",
                        ReserveParam.builder()
                                .startAt(null)
                                .endAt(meeting.getStartAt().minusHours(1))
                        .build()
                )
        );
    }

    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("editReservationArguments")
    @DisplayName("회의 일정 수정 실패 케이스")
    void edit_reservation_time_fail(String description, ReserveParam param) {
        assertThatThrownBy(() ->
                getMeeting().changeReservation(null, param.startAt(), param.endAt(), null, param.title())
        ).isInstanceOf(IllegalStateException.class);
    }

    @Builder
    private record ReserveParam(
            MeetingRoom meetingRoom,
            Emp reserver,
            String title,
            LocalDate meetingDate,
            LocalTime startAt,
            LocalTime endAt,
            List<Emp> participantIds
    ) {}

    private static Meeting getMeeting() {
        MeetingRoom room = getMeetingRoom();
        Emp emp  = getApprovedEmp();
        String title = "testTitle";
        LocalDate date = LocalDate.of(2026,3,3);
        LocalTime startTime = LocalTime.of(13,0,0);
        LocalTime endTime = LocalTime.of(14,0,0);
        List<Emp> participants = List.of(getApprovedEmp("202601005", "participant1"), getApprovedEmp("202601006", "participant2"));


        return reserve(room, emp, title, date, startTime, endTime, participants);
    }

}