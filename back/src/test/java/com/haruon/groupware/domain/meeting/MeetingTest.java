package com.haruon.groupware.domain.meeting;

import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.event.DomainEvent;
import com.haruon.groupware.domain.event.byMeetingReservation.MeetingCanceledEvent;
import com.haruon.groupware.domain.event.byMeetingReservation.MeetingChangedEvent;
import com.haruon.groupware.domain.event.byMeetingReservation.MeetingParticipantReplaceEvent;
import com.haruon.groupware.domain.event.byMeetingReservation.MeetingReservedEvent;
import lombok.Builder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.haruon.groupware.domain.meeting.Meeting.reserve;
import static com.haruon.groupware.domain.meeting.MeetingRoomFixture.getMeetingRoom;
import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MeetingTest {

    @Test
    @DisplayName("회의 예약 테스트, 회의 예약시, 참여자일정반영 회의등록이벤트가 발생한다.")
    void reserveMeeting_success() {
        MeetingRoom room = getMeetingRoom();
        Emp emp  = getApprovedEmp();
        String title = "testTitle";
        LocalDate date = LocalDate.of(2026,3,3);
        LocalTime startTime = LocalTime.of(13,0,0);
        LocalTime endTime = LocalTime.of(14,0,0);
        List<Emp> participants = List.of(getApprovedEmp("202601005", "participant1"), getApprovedEmp("202601006", "participant2"));


        ReflectionTestUtils.setField(room, "id", 1L);
        ReflectionTestUtils.setField(emp, "id", 1L);
        ReflectionTestUtils.setField(emp, "id", 1L);
        ReflectionTestUtils.setField(participants.getFirst(), "id", 2L);
        ReflectionTestUtils.setField(participants.get(1), "id", 3L);

        Set<Long> participantIds = participants.stream().map(Emp::getId).collect(Collectors.toSet());
        Meeting reserve = reserve(room, emp, title, date, startTime, endTime, participants);

        assertThat(reserve).extracting(
                Meeting::getMeetingRoom, Meeting::getEmp, Meeting::getTitle,
                Meeting::getMeetingDate, Meeting::getStartAt, Meeting::getEndAt
        ).containsExactly(room, emp, title, date, startTime, endTime);

        assertThat(reserve.isCancel()).isFalse();

        List<? extends DomainEvent> domainEvents = reserve.domainEvents();
        assertThat(domainEvents.getFirst()).isExactlyInstanceOf(MeetingReservedEvent.class);

        MeetingReservedEvent meetingReservedEvent = (MeetingReservedEvent) domainEvents.getFirst();

        assertThat(meetingReservedEvent).extracting(
                MeetingReservedEvent::sourceKey, MeetingReservedEvent::meetingRoomId, MeetingReservedEvent::reserverId,
                MeetingReservedEvent::title, MeetingReservedEvent::meetingDate, MeetingReservedEvent::startAt, MeetingReservedEvent::endAt
                , MeetingReservedEvent::participantIds
        ).containsExactly(
                reserve.getSourceKey(), room.getId(), emp.getId(),
                reserve.getTitle(), reserve.getMeetingDate(), reserve.getStartAt(), reserve.getEndAt(),
                participantIds
        );
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
    @DisplayName("회의 취소 성공, 회의 예약취소 시, 참여자일정반영 회의취소이벤트가 발생한다.")
    void cancel_reservation() {
        Emp participant = getApprovedEmp("202601001", "1L");
        ReflectionTestUtils.setField(participant, "id", 1L);

        Meeting meeting = getMeeting(participant);
        meeting.cancel();
        assertThat(meeting.isCancel()).isTrue();

        Set<Long> participantIds = meeting.getMeetingParticipants().stream()
                .map(MeetingParticipant::getEmp)
                .map(Emp::getId)
                .collect(Collectors.toSet());

        List<? extends DomainEvent> domainEvents = meeting.domainEvents();
        assertThat(domainEvents.getLast()).isExactlyInstanceOf(MeetingCanceledEvent.class);
        MeetingCanceledEvent meetingCancelledEvent = (MeetingCanceledEvent) domainEvents.getLast();

        assertThat(meetingCancelledEvent).extracting(
                MeetingCanceledEvent::sourceKey, MeetingCanceledEvent::participantIds
        ).containsExactly(
                meeting.getSourceKey(), participantIds
        );
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

        meeting.changeReservationInfo(editedDate, editedStartTime, editedEndTime, editedMeetingRoom, title);

        assertThat(meeting).extracting(
                Meeting::getMeetingDate, Meeting::getStartAt, Meeting::getEndAt, Meeting::getMeetingRoom, Meeting::getTitle
        ).containsExactly(
                editedDate, editedStartTime, editedEndTime, editedMeetingRoom, title
        );
    }

    @Test
    @DisplayName("회의 일정정보 수정시, 참여자일정반영 회의 수정이벤트가 발생한다.")
    void edit_reservation_time_event() {
        Emp approvedEmp = getApprovedEmp("202601001", "1L");
        ReflectionTestUtils.setField(approvedEmp, "id", 1L);

        Meeting meeting = getMeeting(approvedEmp);
        LocalDate editedDate = meeting.getMeetingDate().plusDays(1);
        LocalTime editedStartTime = meeting.getStartAt().plusHours(1);
        LocalTime editedEndTime = meeting.getEndAt().plusHours(1);
        MeetingRoom editedMeetingRoom = MeetingRoom.createMeetingRoom("nd", "de", 10);
        ReflectionTestUtils.setField(editedMeetingRoom, "id", 1L);

        String title = meeting.getTitle().concat("new");

        meeting.changeReservationInfo(editedDate, editedStartTime, editedEndTime, editedMeetingRoom, title);

        Set<Long> participantIds = meeting.getMeetingParticipants().stream()
                .map(MeetingParticipant::getEmp)
                .map(Emp::getId).collect(Collectors.toSet());

        List<? extends DomainEvent> domainEvents = meeting.domainEvents();
        assertThat(domainEvents.getLast()).isExactlyInstanceOf(MeetingChangedEvent.class);
        MeetingChangedEvent changedEvent = (MeetingChangedEvent) domainEvents.getLast();

        assertThat(changedEvent).extracting(
                MeetingChangedEvent::sourceKey, MeetingChangedEvent::meetingRoomId, MeetingChangedEvent::title,
                MeetingChangedEvent::meetingDate, MeetingChangedEvent::startAt, MeetingChangedEvent::endAt,
                MeetingChangedEvent::participantEmpIds
        ).containsExactly(
                meeting.getSourceKey(), meeting.getMeetingRoom().getId(), meeting.getTitle(),
                meeting.getMeetingDate(), meeting.getStartAt(), meeting.getEndAt(),
                participantIds
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
                getMeeting().changeReservationInfo(null, param.startAt(), param.endAt(), null, param.title())
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("회의 참여자 변경시, 새로추가되는 사람과 제외되는 사람이 있을 경우 참여자 변경 이벤트가 발행된다.")
    void changeParticipants_event() {
        Meeting meeting = getMeeting();
        Emp existedEmp = meeting.getMeetingParticipants().getFirst().getEmp();
        Emp newEmp = getApprovedEmp("202601007", "participant3");
        Emp deleteTargetEmp = meeting.getMeetingParticipants().get(1).getEmp();

        ReflectionTestUtils.setField(existedEmp, "id", 1L);
        ReflectionTestUtils.setField(newEmp, "id", 2L);
        ReflectionTestUtils.setField(deleteTargetEmp, "id", 3L);

        List<Emp> newParticipants = List.of(existedEmp, newEmp);

        meeting.changeParticipants(newParticipants);

        List<? extends DomainEvent> domainEvents = meeting.domainEvents();
        assertThat(domainEvents.get(1)).isExactlyInstanceOf(MeetingParticipantReplaceEvent.class);
        assertThat(domainEvents.get(2)).isExactlyInstanceOf(MeetingParticipantReplaceEvent.class);
        MeetingParticipantReplaceEvent removeEvent = (MeetingParticipantReplaceEvent) domainEvents.get(1);
        MeetingParticipantReplaceEvent addEvent = (MeetingParticipantReplaceEvent) domainEvents.get(2);

        assertThat(removeEvent).extracting(
                MeetingParticipantReplaceEvent::sourceKey, MeetingParticipantReplaceEvent::removedParticipantIds, MeetingParticipantReplaceEvent::addParticipantIds
        ).containsExactly(
                meeting.getSourceKey(), Set.of(deleteTargetEmp.getId()), null
        );

        assertThat(addEvent).extracting(
                MeetingParticipantReplaceEvent::sourceKey, MeetingParticipantReplaceEvent::removedParticipantIds, MeetingParticipantReplaceEvent::addParticipantIds
        ).containsExactly(
                meeting.getSourceKey(), null, Set.of(newEmp.getId())
        );
    }

    @Test
    @DisplayName("회의등록 후 도메인 이벤트 clear 테스트")
    void clearEvent() {
        Meeting meeting = getMeeting();

        meeting.clearDomainEvents();

        assertThat(meeting.domainEvents()).hasSize(0);

    }

    @Test
    @DisplayName("회의 참여자 변경 성공테스트")
    void changeParticipants_test() {
        Meeting meeting = getMeeting();
        Emp existedEmp = meeting.getMeetingParticipants().getFirst().getEmp();
        Emp newEmp = getApprovedEmp("202601007", "participant3");
        Emp deleteTargetEmp = meeting.getMeetingParticipants().get(1).getEmp();
        List<Emp> newParticipants = List.of(existedEmp, newEmp);

        meeting.changeParticipants(newParticipants);

        List<Emp> existedEmps = meeting.getMeetingParticipants().stream().map(MeetingParticipant::getEmp).toList();

        assertThat(existedEmps.containsAll(List.of(existedEmp, newEmp))).isTrue();

        assertThat(existedEmps.contains(deleteTargetEmp)).isFalse();
    }

    private static Stream<Arguments> changeParticipantsFailArguments() {
        return Stream.of(
                Arguments.of("참여자 목록은 null일 수 없음",
                        null
                ),Arguments.of("참여자 목록은 비어 있을 수 없음",
                        List.of()
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("changeParticipantsFailArguments")
    @DisplayName("참여자변경 실패 케이스 - 1")
    void changeParticipants_without_participant_fails(String description, List<Emp> newParticipants) {
        Meeting meeting = getMeeting();
        assertThatThrownBy(() ->
                    meeting.changeParticipants(newParticipants)
        ).hasMessage(description);
    }

    @Test
    @DisplayName("취소된 일정은 참여자 목록을 변경할 수 없음")
    void changeParticipants_with_cancel_meeting_fails() {
        Meeting meeting = getMeeting();
        meeting.cancel();
        List<Emp> newParticipants = List.of(getApprovedEmp("202601007", "participant3"));

        assertThatThrownBy(() ->
            meeting.changeParticipants(newParticipants)
        ).hasMessage("취소된 회의 정보를 수정할 수 없음");
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

    private static Meeting getMeeting(Emp participant) {
        MeetingRoom room = getMeetingRoom();
        Emp emp  = getApprovedEmp();
        String title = "testTitle";
        LocalDate date = LocalDate.of(2026,3,3);
        LocalTime startTime = LocalTime.of(13,0,0);
        LocalTime endTime = LocalTime.of(14,0,0);
        List<Emp> participants = List.of(participant);


        return reserve(room, emp, title, date, startTime, endTime, participants);
    }

}