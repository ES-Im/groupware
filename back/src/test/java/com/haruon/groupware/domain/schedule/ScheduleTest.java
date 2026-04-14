package com.haruon.groupware.domain.schedule;

import com.haruon.groupware.domain.empInfo.Emp;
import lombok.Builder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestFactory;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.stream.Stream;

import static com.haruon.groupware.domain.schedule.Schedule.registerSchedule;
import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ScheduleTest {

    @Test
    @DisplayName("일정등록 성공테스트")
    void register_schedule_success() {
        Emp emp = getApprovedEmp();

        Schedule schedule = registerSchedule(
                "random",
                ScheduleType.MANUAL,
                emp,
                "title", "content",
                LocalDate.of(2026, 01, 01),
                LocalTime.of(15, 0),
                LocalTime.of(15, 0),
                false, false
        );

        assertThat(schedule).isNotNull();
        assertThat(schedule.isCanceled()).isFalse();
        assertThat(schedule.getScheduleParticipants().getFirst().getEmp().equals(emp)).isTrue();
    }

    @Test
    @DisplayName("일정등록 실패 케이스 - 일정의 시작시간은 종료시간보다 늦게 등록할 수 없다.")
    void register_schedule_fail_when_startAt_after_endAt() {
        Emp emp = getApprovedEmp();

        assertThatThrownBy(() ->
                registerSchedule(
                        "random",
                        ScheduleType.MANUAL,
                        emp,
                        "title",
                        "content",
                        LocalDate.of(2026, 1, 1),
                        LocalTime.of(15, 0),
                        LocalTime.of(13, 0),
                        false,
                        false
                )
        ).isInstanceOf(IllegalStateException.class);
    }

    private static Stream<Arguments> scheduleParams() {
        Emp emp = getApprovedEmp();

        return Stream.of(
                Arguments.of("시작시간이 Null이면 일정을 등록할 수 없다",
                        RegisterTestParam.builder()
                                .sourceKey("test")
                                .type(ScheduleType.MANUAL)
                                .emp(emp)
                                .title("TestTitle")
                                .content("TestContent")
                                .scheduleDate(LocalDate.of(2026, 1, 1))
                                .startAt(null)
                                .endAt(LocalTime.of(13, 0))
                                .isAllDay(false)
                                .isPublic(false)
                        .build()
                ),
                Arguments.of("종료시간이 Null이면 일정을 등록할 수 없다",
                        RegisterTestParam.builder()
                                .sourceKey("test")
                                .type(ScheduleType.MANUAL)
                                .emp(emp)
                                .title("TestTitle")
                                .content("TestContent")
                                .scheduleDate(LocalDate.of(2026, 1, 1))
                                .startAt(LocalTime.of(15, 0))
                                .endAt(null)
                                .isAllDay(false)
                                .isPublic(false)
                        .build()
                ),
                Arguments.of("sourceId가 Null이면 일정을 등록할 수 없다",
                        RegisterTestParam.builder()
                                .sourceKey(null)
                                .type(ScheduleType.MANUAL)
                                .emp(emp)
                                .title("TestTitle")
                                .content("TestContent")
                                .scheduleDate(LocalDate.of(2026, 1, 1))
                                .startAt(LocalTime.of(15, 0))
                                .endAt(LocalTime.of(16, 0))
                                .isAllDay(false)
                                .isPublic(false)
                        .build()
                ),
                Arguments.of("일정타입이 Null이면 일정을 등록할 수 없다",
                        RegisterTestParam.builder()
                                .sourceKey("test")
                                .type(null)
                                .emp(emp)
                                .title("TestTitle")
                                .content("TestContent")
                                .scheduleDate(LocalDate.of(2026, 1, 1))
                                .startAt(LocalTime.of(15, 0))
                                .endAt(LocalTime.of(16, 0))
                                .isAllDay(false)
                                .isPublic(false)
                        .build()
                ),
                Arguments.of("사원(일정작성자)이 Null이면 일정을 등록할 수 없다",
                        RegisterTestParam.builder()
                                .sourceKey("test")
                                .type(ScheduleType.MANUAL)
                                .emp(null)
                                .title("TestTitle")
                                .content("TestContent")
                                .scheduleDate(LocalDate.of(2026, 1, 1))
                                .startAt(LocalTime.of(15, 0))
                                .endAt(LocalTime.of(16, 0))
                                .isAllDay(false)
                                .isPublic(false)
                        .build()
                ),
                Arguments.of("제목이 Null이면 일정을 등록할 수 없다",
                        RegisterTestParam.builder()
                                .sourceKey(null)
                                .type(ScheduleType.MANUAL)
                                .emp(emp)
                                .title(null)
                                .content("TestContent")
                                .scheduleDate(LocalDate.of(2026, 1, 1))
                                .startAt(LocalTime.of(15, 0))
                                .endAt(LocalTime.of(16, 0))
                                .isAllDay(false)
                                .isPublic(false)
                        .build()
                ),
                Arguments.of("내용이 Null이면 일정을 등록할 수 없다",
                        RegisterTestParam.builder()
                                .sourceKey(null)
                                .type(ScheduleType.MANUAL)
                                .emp(emp)
                                .title("TestTitle")
                                .content(null)
                                .scheduleDate(LocalDate.of(2026, 1, 1))
                                .startAt(LocalTime.of(15, 0))
                                .endAt(LocalTime.of(16, 0))
                                .isAllDay(false)
                                .isPublic(false)
                        .build()
                ),
                Arguments.of("일정일자가 Null이면 일정을 등록할 수 없다",
                        RegisterTestParam.builder()
                                .sourceKey(null)
                                .type(ScheduleType.MANUAL)
                                .emp(emp)
                                .title("TestTitle")
                                .content("TestContent")
                                .scheduleDate(null)
                                .startAt(LocalTime.of(15, 0))
                                .endAt(LocalTime.of(16, 0))
                                .isAllDay(false)
                                .isPublic(false)
                        .build()
                )
        );
    }

    @ParameterizedTest(name = "{index} ==> {0}")
    @DisplayName("일정등록 실패 케이스 - Null")
    @MethodSource("scheduleParams")
    void register_schedule_fail(String description, RegisterTestParam param) {
       
        assertThatThrownBy(() ->
                registerSchedule(
                        param.sourceKey(),
                        param.type(),
                        param.emp(),
                        param.title(),
                        param.content(),
                        param.scheduleDate(),
                        param.startAt(), param.endAt(),
                        param.isAllDay(), param.isPublic()
                )
        ).isInstanceOf(NullPointerException.class);

    }

    @Builder
    private record RegisterTestParam(
            String sourceKey,
            ScheduleType type,
            Emp emp,
            String title,
            String content,
            LocalDate scheduleDate,
            LocalTime startAt,
            LocalTime endAt,
            boolean isAllDay,
            boolean isPublic
    ) {}

    @Test
    @DisplayName("일정 취소을 성공하면 1(변화있음)을 반환한다.")
    void schedule_cancel_success() {
        Schedule schedule = getSchedule();

        assertThat(schedule.cancel()).isEqualTo(1);
        assertThat(schedule.isCanceled()).isTrue();
    }
    
    @Test
    @DisplayName("이미 취소된 일정을 취소하면 0(변화없음)을 반환한다.")
    void schedule_cancel_fail() {
        Schedule schedule = getSchedule();
        schedule.cancel();

        assertThat(schedule.isCanceled()).isTrue();
        assertThat(schedule.cancel()).isEqualTo(0);
    }

    @TestFactory
    @DisplayName("일정 참여자 추가/삭제 테스트")
    Collection<DynamicTest> add_participant_success() {
        Schedule schedule = getSchedule();
        Emp newEmp = getApprovedEmp("202601002", "Test2");

        return List.of(
                DynamicTest.dynamicTest("일정에 다른 사원을 참가자로 추가할 수 있다.(성공 = 1반환)", () -> {
                    int result = schedule.addParticipant(newEmp);
                    assertThat(result).isOne();
                    assertThat(schedule.getScheduleParticipants().size()).isEqualTo(2);
                }),
                DynamicTest.dynamicTest("일정에 같은 참가자를 추가할 때 아무런 변화 없이 0을 반환한다.", () -> {
                    int result = schedule.addParticipant(newEmp);
                    assertThat(result).isZero();
                    assertThat(schedule.getScheduleParticipants().size()).isEqualTo(2);
                }),
                DynamicTest.dynamicTest("일정 참가자를 제할 수 있다. (성공 = 1반환)", () -> {
                    int result = schedule.removeParticipant(newEmp);
                    assertThat(result).isOne();
                    assertThat(schedule.getScheduleParticipants().size()).isEqualTo(1);
                }),
                DynamicTest.dynamicTest("일정에 없는 참가자를 제외할 때 아무런 변화 없이 0을 반환한다.", () -> {
                    int result = schedule.removeParticipant(newEmp);
                    assertThat(result).isZero();
                    assertThat(schedule.getScheduleParticipants().size()).isEqualTo(1);
                })
        );
    }

    private static Stream<Arguments> changeScheduleParam() {
        return Stream.of(
                Arguments.of("제목을 바꿀수 있다. → 1(수정성공)을 반환",
                        changeManualScheduleParam.builder()
                                .title("editedTitle")
                        .build(),
                        1
                ),
                Arguments.of("내용을 바꿀 수 있다. → 1(수정성공)을 반환",
                        changeManualScheduleParam.builder()
                                .content("editedContent")
                        .build(),
                        1
                ),
                Arguments.of("시작시간을 바꿀 수 있다. → 1(수정성공)을 반환",
                        changeManualScheduleParam.builder()
                                .startAt(LocalTime.of(14, 0))
                                .build(),
                        1
                ),
                Arguments.of("종료시간을 바꿀 수 있다. →  1(수정성공)을 반환",
                        changeManualScheduleParam.builder()
                                .endAt(LocalTime.of(16, 0))
                                .build(),
                        1
                )
        );
    }

    @ParameterizedTest(name = "{index} ==> 수기일정은 {0}")
    @MethodSource("changeScheduleParam")
    @DisplayName("일정 수정 성공 테스트")
    void edit_schedule_success(String description, changeManualScheduleParam param, int expectedResult) {
        Schedule schedule = getSchedule();

        assertThat(schedule.changeManualSchedule(
                param.title(),
                param.content(),
                param.startAt(),
                param.endAt()
        )).isEqualTo(expectedResult);
    }
    private static Stream<Arguments> changeScheduleFailParam() {
        Schedule schedule = getSchedule();

        return Stream.of(
                Arguments.of("같은 제목으로 바꾼다면 0(변화없음)을 반환",
                        changeManualScheduleParam.builder()
                                .title(schedule.getTitle())
                        .build(),
                        0
                ),
                Arguments.of("같은 내용으로 바꾼다면 0(변화없음)을 반환",
                        changeManualScheduleParam.builder()
                                .content(schedule.getContent())
                        .build(),
                        0
                ),
                Arguments.of("같은 시작 시각으로 바꾼다면 0(변화없음)을 반환",
                        changeManualScheduleParam.builder()
                                .startAt(schedule.getStartAt())
                                .build(),
                        0
                ),
                Arguments.of("같은 종료 시각으로 바꾼다면 0(변화없음)을 반환",
                        changeManualScheduleParam.builder()
                                .endAt(schedule.getEndAt())
                                .build(),
                        0
                )
        );
    }

    @ParameterizedTest(name = "{index} ==> 수기일정은 {0}")
    @MethodSource("changeScheduleFailParam")
    @DisplayName("일정 수정 실패 테스트")
    void edit_schedule_fail(String description, changeManualScheduleParam param, int expectedResult) {
        Schedule schedule = getSchedule();

        assertThat(schedule.changeManualSchedule(
                param.title(),
                param.content(),
                param.startAt(),
                param.endAt()
        )).isEqualTo(expectedResult);
    }

    @Builder
    private record changeManualScheduleParam(
            String title,
            String content,
            LocalTime startAt,
            LocalTime endAt
    ) {}

    private static Schedule getSchedule() {
        Emp emp = getApprovedEmp();

        return registerSchedule(
                "sourceKey",
                ScheduleType.MANUAL,
                emp,
                "title", "content",
                LocalDate.of(2026, 1, 1),
                LocalTime.of(15, 0),
                LocalTime.of(15, 0),
                false, false
        );
    }
}