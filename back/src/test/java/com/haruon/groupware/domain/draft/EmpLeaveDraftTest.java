package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.draft.sub.LeaveType;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.event.DomainEvent;
import com.haruon.groupware.domain.event.schedule.ScheduleCreationEvent;
import lombok.Builder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Stream;

import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;

public class EmpLeaveDraftTest {

    @Test
    @DisplayName("연가 미상신 기안서 생성 테스트")
    void createDraft() {
        LocalDateTime startAt = LocalDateTime.of(2026, 4, 1, 9, 0, 0);
        LocalDateTime endAt = LocalDateTime.of(2026, 4, 5, 18, 0, 0);
        LeaveType leaveType = LeaveType.ANNUAL;

        LeaveDraft leaveDraft = getLeaveDraft(startAt, endAt, leaveType);

        assertThat(leaveDraft).extracting(
                LeaveDraft::getStartAt, LeaveDraft::getEndAt, LeaveDraft::getLeaveType
        ).containsExactly(
                startAt, endAt, leaveType
        );

        assertThat(leaveDraft.getSourceKey()).isNotNull();

    }

    @Test
    @DisplayName("연가 상신 기안서 생성 테스트")
    void createSubmitted() {
        LocalDateTime startAt = LocalDateTime.of(2026, 4, 1, 9, 0, 0);
        LocalDateTime endAt = LocalDateTime.of(2026, 4, 5, 18, 0, 0);
        LeaveType leaveType = LeaveType.ANNUAL;

        LeaveDraft leaveDraft = getLeaveSubmitted(startAt, endAt, leaveType);

        assertThat(leaveDraft).extracting(
                LeaveDraft::getStartAt, LeaveDraft::getEndAt, LeaveDraft::getLeaveType
        ).containsExactly(
                startAt, endAt, leaveType
        );

        assertThat(leaveDraft.getSourceKey()).isNotNull();
    }

    private static Stream<Arguments> initLeaveDraftArguments() {
        LocalDateTime startAt = LocalDateTime.of(2026, 4, 1, 9, 0, 0);
        LocalDateTime endAt = LocalDateTime.of(2026, 4, 5, 18, 0, 0);
        LeaveType leaveType = LeaveType.ANNUAL;

        return Stream.of(
                Arguments.of("휴가 타입은 null일 수 없음",
                        LeaveDraftParam.builder().startAt(startAt).endAt(endAt).leaveType(null).build()
                ),Arguments.of("휴가 시작일시는 null일 수 없음",
                        LeaveDraftParam.builder().startAt(null).endAt(endAt).leaveType(leaveType).build()
                ),Arguments.of("휴가 종료일시는 null일 수 없음",
                        LeaveDraftParam.builder().startAt(startAt).endAt(null).leaveType(leaveType).build()
                ),Arguments.of("종료시간은 시작시간보다 이를 수 없음",
                        LeaveDraftParam.builder().startAt(startAt).endAt(startAt.minusHours(1)).leaveType(leaveType).build()
                ),Arguments.of("휴가 시작시각은 정각이어야 한다.",
                        LeaveDraftParam.builder().startAt(startAt.plusMinutes(30)).endAt(endAt).leaveType(leaveType).build()
                ),Arguments.of("휴가 종료시각은 정각이어야 한다.",
                        LeaveDraftParam.builder().startAt(startAt).endAt(endAt.plusMinutes(30)).leaveType(leaveType).build()
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("initLeaveDraftArguments")
    @DisplayName("연차신청서 기안 실패 케이스")
    void init_leave_draft_fail(String expectedMessage, LeaveDraftParam param) {
        assertThatThrownBy(() ->
            getLeaveDraft(
                    param.startAt(),
                    param.endAt(),
                    param.leaveType()
            )
        ).hasMessage(expectedMessage);
    }

    private static Stream<Arguments> editArguments() {
        LocalDateTime startAt = LocalDateTime.of(2026, 3, 1, 9, 0, 0);
        LocalDateTime endAt = LocalDateTime.of(2026, 3, 5, 18, 0, 0);
        LeaveType leaveType = LeaveType.ANNUAL;

        return Stream.of(
                Arguments.of("시작시간을 변경할 수 있다.",
                        LeaveDraftParam.builder().startAt(startAt).build()
                ),Arguments.of("종료시간을 변경할 수 있다.",
                        LeaveDraftParam.builder().endAt(endAt).build()
                ),Arguments.of("휴가타입을 변경할 수 있다.",
                        LeaveDraftParam.builder().leaveType(leaveType).build()
                )
        );
    }

    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("editArguments")
    @DisplayName("휴가신청서 수정 케이스")
    void edit_LeaveDraft(String description, LeaveDraftParam param) {
        LeaveDraft leaveDraft = getLeaveDraft(LocalDateTime.of(2026, 3, 1, 0, 0, 0),
                LocalDateTime.of(2026, 3, 6, 0, 0, 0),
                LeaveType.HOURLY);

        leaveDraft.editLeaveDraft(
                null, null,
                param.startAt(),
                param.endAt(),
                param.leaveType(),
                1L
        );
    }

    private static Stream<Arguments> editFailArguments() {
        LocalDateTime earlyEndTime = LocalDateTime.of(2025, 2, 5, 18, 0, 0);
        LocalDateTime halfTime = LocalDateTime.of(2026, 3, 5, 18, 1, 0);

        return Stream.of(
                Arguments.of("종료시간은 시작시간보다 이를 수 없음",
                        LeaveDraftParam.builder().endAt(earlyEndTime).build()
                ),Arguments.of("휴가 시작시각은 정각이어야 한다.",
                        LeaveDraftParam.builder().startAt(halfTime).build()
                ),Arguments.of("휴가 종료시각은 정각이어야 한다.",
                        LeaveDraftParam.builder().endAt(halfTime).build()
                )
        );
    }

    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("editFailArguments")
    @DisplayName("휴가신청서 수정 케이스")
    void edit_LeaveDraft_fail(String expectedMessage, LeaveDraftParam param) {
        LeaveDraft leaveDraft = getLeaveDraft(
                LocalDateTime.of(2026, 3, 1, 0, 0, 0),
                LocalDateTime.of(2026, 3, 6, 0, 0, 0),
                LeaveType.HOURLY);

        assertThatThrownBy(() ->
                leaveDraft.editLeaveDraft(
                        null, null,
                        param.startAt(),
                        param.endAt(),
                        param.leaveType(),
                        1L
                )
        ).hasMessage(expectedMessage);

    }

    @Builder
    private record LeaveDraftParam(
            LocalDateTime startAt, LocalDateTime endAt, LeaveType leaveType
    ) {}

    @Test
    @DisplayName("휴가 기안서 승인이 마무리되면 휴가승인 이벤트가 발생한다.")
    void leave_approve_event() {
        // given
        Emp drafter = getApprovedEmp("202601001", "drafter");
        Emp approver1 = getApprovedEmp("202601002", "approver1");
        Emp approver2 = getApprovedEmp("202601003", "approver2");
        ApproversParam approverParam1 = new ApproversParam(ApprovalRole.APPROVER, 1, approver1);
        ApproversParam approverParam2 = new ApproversParam(ApprovalRole.APPROVER, 2, approver2);
        String title = "title";
        String content = "content";
        LocalDateTime startAt = LocalDateTime.of(2026, 4, 20,0,0,0);
        LocalDateTime endAt = LocalDateTime.of(2026, 4, 21, 0,0,0);
        LeaveType type = LeaveType.ANNUAL;

        LeaveDraft submitted = LeaveDraft.createSubmitted(
                drafter, title, content,
                startAt, endAt, type,
                List.of(approverParam1, approverParam2),
                LocalDateTime.of(2026, 4, 16, 9, 0),
                1L
        );

        submitted.approve(approver1, LocalDateTime.of(2026, 4, 20,0,0,0));
        submitted.approve(approver2, LocalDateTime.of(2026, 4, 20,0,0,0));

        List<? extends DomainEvent> domainEvents = submitted.domainEvents();
        DomainEvent domainEvent = domainEvents.getFirst();

        ScheduleCreationEvent scheduleCreationEvent = (ScheduleCreationEvent) domainEvent;
        assertEquals(submitted.getSourceKey(), scheduleCreationEvent.sourceKey());
    }

    @Test
    @DisplayName("휴가 기안서 승인이 마무리되지않으면 휴가승인 이벤트가 발생하지 않는다.")
    void leave_not_approved_event() {
        Emp drafter = getApprovedEmp("202601001", "drafter");
        Emp approver1 = getApprovedEmp("202601002", "approver1");
        Emp approver2 = getApprovedEmp("202601003", "approver2");
        ApproversParam approverParam1 = new ApproversParam(ApprovalRole.APPROVER, 1, approver1);
        ApproversParam approverParam2 = new ApproversParam(ApprovalRole.APPROVER, 2, approver2);
        String title = "title";
        String content = "content";
        LocalDateTime startAt = LocalDateTime.of(2026, 4, 20,0,0,0);
        LocalDateTime endAt = LocalDateTime.of(2026, 4, 21, 0,0,0);
        LeaveType type = LeaveType.ANNUAL;

        LeaveDraft submitted = LeaveDraft.createSubmitted(
                drafter, title, content,
                startAt, endAt, type,
                List.of(approverParam1, approverParam2),
                LocalDateTime.of(2026, 4, 16, 9, 0),
                1L
        );

        submitted.approve(approver1, LocalDateTime.of(2026, 4, 20,0,0,0));

        List<? extends DomainEvent> domainEvents = submitted.domainEvents();
        assertThat(domainEvents).isEmpty();
    }

    private static LeaveDraft getLeaveDraft(LocalDateTime startAt, LocalDateTime endAt, LeaveType leaveType) {
        return LeaveDraft.createDraft(
                getApprovedEmp(), "title", "content",
                startAt, endAt, leaveType,
                List.of(new ApproversParam(ApprovalRole.APPROVER, 1, getApprovedEmp("202601101", "approver"))),
                1L
        );
    }

    private static LeaveDraft getLeaveSubmitted(LocalDateTime startAt, LocalDateTime endAt, LeaveType leaveType) {
        return LeaveDraft.createSubmitted(
                getApprovedEmp(), "title", "content",
                startAt, endAt, leaveType,
                List.of(new ApproversParam(ApprovalRole.APPROVER, 1, getApprovedEmp("202601101", "approver"))),
                LocalDateTime.of(2026,4,1,0,0,0),
                1L
        );
    }
}

