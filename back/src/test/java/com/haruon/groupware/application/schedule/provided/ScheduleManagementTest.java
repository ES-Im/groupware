package com.haruon.groupware.application.schedule.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.role.ActiveEmployeeNotFoundException;
import com.haruon.groupware.application.schedule.required.ScheduleRepository;
import com.haruon.groupware.application.schedule.service.ManualScheduleParam;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.schedule.Schedule;
import com.haruon.groupware.domain.schedule.ScheduleParticipant;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static com.haruon.groupware.application.dbFixture.EmpFixture.saveRegisteredEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

@Slf4j
@TestIntegrationConfig
record ScheduleManagementTest(
    ScheduleRepository scheduleRepository,
    EmpRepository empRepository,
    DeptRepository deptRepository,

    ScheduleManagement scheduleRegister,

    EntityManager entityManager
) {

    private static final LocalDate BASE_DATE = LocalDate.of(2100, 5, 1);
    private static final LocalTime START_TIME = LocalTime.of(9, 0);
    private static final LocalTime END_TIME = LocalTime.of(18, 0);

    @AfterEach
    void tearDown() {
        scheduleRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Transactional
    @Test
    @DisplayName("활성화 사원이라면, 수기등록 일정을 등록할 수 있다")
    void register_manual_schedule_by_active_emp_success() {
        Emp emp = saveApprovedEmp(empRepository,"202601100", "loginEmp1");

        Long ownerId = emp.getId();
        String title = "title";
        String content = "content";
        LocalDateTime startAt = LocalDateTime.of(BASE_DATE, START_TIME);
        LocalDateTime endAt = LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2);

        String getSourceKey = scheduleRegister.registerSchedules(
                            ManualScheduleParam.builder()
                                    .ownerId(ownerId)
                                    .title(title)
                                    .content(content)
                                    .startAt(startAt)
                                    .endAt(endAt)
                                    .build()
        );

        entityManager.flush();
        entityManager.clear();

        List<Schedule> schedule = scheduleRepository.findBySourceKey(getSourceKey);

        assertThat(schedule.getFirst().isCanceled())
                .as("취소여부 기본값은 false이다")
                .isFalse();

        assertThat(schedule.getFirst().getSourceKey())
                .as("수기일정 여부 생성시, sourceKey가 UUID로 생성된다.")
                .isInstanceOf(String.class)
                .isNotNull();

        assertThat(schedule.getFirst().getScheduleParticipants().stream().findFirst().get().getEmp())
                .as("일정 등록자는 자동으로 추가된다.")
                .isEqualTo(emp);

        assertThat(schedule)
                .as("날짜마다 일정이 건건이 등록된다.")
                .hasSize(3);
    }





    @Test
    @DisplayName("비활성 사원은 일정을 등록할 수 없다")
    void register_schedule_by_inactive_owner_fail() {
        Emp inactiveEmp = saveRegisteredEmp(empRepository);

        assertThatThrownBy(() ->
                getManualSchedules(
                        inactiveEmp,
                        LocalDateTime.of(BASE_DATE, START_TIME),
                        LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
                )
        ).isInstanceOf(ActiveEmployeeNotFoundException.class);
    }

    @Transactional
    @Test
    @DisplayName("참가자 추가 시, 비활성 사원을 추가하면 실패한다.")
    void add_participant_by_inactive_emp_fail() {
        Emp inactiveEmp = saveRegisteredEmp(empRepository);

        List<Schedule> manualSchedules = getManualSchedules(
                saveApprovedEmp(empRepository, "202601101", "emp111"),
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        assertThatThrownBy(() ->
                scheduleRegister.addParticipants(manualSchedules.getFirst().getId(), Set.of(inactiveEmp.getId()), false)
        ).isInstanceOf(ActiveEmployeeNotFoundException.class);

    }

    @Transactional
    @Test
    @DisplayName("단일 일정 참가자 추가 - bulkEdit = false")
    void add_participant_to_single_schedule_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        Emp otherEmp = saveApprovedEmp(empRepository, "202601102", "emp222");

        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();
        scheduleRegister.addParticipants(firstDayOfSchedule.getId(), Set.of(otherEmp.getId()), false);

        Schedule updatedSchedule = scheduleRepository.findById(firstDayOfSchedule.getId()).orElseThrow();

        List<Schedule> otherDaysOfSchedule = scheduleRepository.findBySourceKey(firstDayOfSchedule.getSourceKey());
        otherDaysOfSchedule.remove(firstDayOfSchedule);

        assertThat(updatedSchedule.getScheduleParticipants().stream().map(ScheduleParticipant::getEmp).collect(Collectors.toSet()))
                .as("단일 일정에 참여자 등록시, 해당 날짜에 참여자가 등록된다.")
                .containsExactlyInAnyOrder(register, otherEmp);

        otherDaysOfSchedule.forEach(s -> {
            s.getScheduleParticipants().stream()
                    .map(ScheduleParticipant::getEmp)
                    .collect(Collectors.toSet())
                    .forEach(emp -> assertThat(emp)
                            .as("단일 일정에 참여자 등록시, 다른 날짜에 해당 참여자는 등록되지 않는다.")
                            .isNotEqualTo(otherEmp));
        });

    }

    @Transactional
    @Test
    @DisplayName("동일 이벤트 전체 일정 참가자 추가 - bulkEdit = true")
    void add_participant_to_same_event_schedules_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        Emp otherEmp = saveApprovedEmp(empRepository, "202601102", "emp222");

        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();
        scheduleRegister.addParticipants(firstDayOfSchedule.getId(), Set.of(otherEmp.getId()), true);

        List<Schedule> allDaysOfSchedule = scheduleRepository.findBySourceKey(firstDayOfSchedule.getSourceKey());

        allDaysOfSchedule.stream()
                .map(ad -> ad.getScheduleParticipants().stream()
                        .map(ScheduleParticipant::getEmp)
                ).collect(Collectors.toSet())
                .forEach(result ->
                        assertThat(result)
                                .as("전체 일정 참가자 추가 시, 해당 일정(같은 sourceKey공유)의 참여자 목록에 추가된다.")
                                .containsExactlyInAnyOrder(register, otherEmp)
                );
    }

    @Transactional
    @Test
    @DisplayName("단일 일정 참가자 삭제 - bulkEdit = false")
    void remove_participant_from_single_schedule_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        Emp otherEmp = saveApprovedEmp(empRepository, "202601102", "emp222");
        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();
        scheduleRegister.addParticipants(firstDayOfSchedule.getId(), Set.of(otherEmp.getId()), true);
        scheduleRegister.removeParticipants(firstDayOfSchedule.getId(), Set.of(otherEmp.getId()), false);
        String sourceKey = firstDayOfSchedule.getSourceKey();

        entityManager.flush();
        entityManager.clear();

        List<Schedule> Schedules = scheduleRepository.findBySourceKey(sourceKey);

        Schedule removedDay = Schedules.stream()
                .filter(s -> s.getId().equals(firstDayOfSchedule.getId())).findFirst().orElseThrow();
        Schedules.remove(removedDay);

        Set<Emp> removeParticipantDay
                = firstDayOfSchedule.getScheduleParticipants().stream()
                .map(ScheduleParticipant::getEmp).collect(Collectors.toSet());
        assertThat(removeParticipantDay)
                .as("삭제 대상 일에는 해당 사원이 제외된다.")
                .doesNotContain(otherEmp);

        Schedules.forEach(s -> {
            Set<Emp> participants = s.getScheduleParticipants().stream()
                    .map(ScheduleParticipant::getEmp)
                    .collect(Collectors.toSet());

            assertThat(participants)
                    .as("삭제 제외 일에는 해당 사원이 제외되지 않는다.")
                    .containsExactlyInAnyOrder(register, otherEmp);
        });

    }

    @Transactional
    @Test
    @DisplayName("동일 이벤트 전체 일정 참가자 삭제 - bulkEdit = true")
    void remove_participant_from_same_event_schedules_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        Emp otherEmp = saveApprovedEmp(empRepository, "202601102", "emp222");
        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();
        String sourceKey = firstDayOfSchedule.getSourceKey();

        scheduleRegister.addParticipants(firstDayOfSchedule.getId(), Set.of(otherEmp.getId()), true);

        entityManager.flush();
        entityManager.clear();

        Schedule reloadedFirstDay = scheduleRepository.findBySourceKey(sourceKey).getFirst();

//        log.info("before remove = {}", firstDayOfSchedule.getScheduleParticipants()
//                .stream().map(p -> p.getEmp().getId()).toList());

        scheduleRegister.removeParticipants(reloadedFirstDay.getId(), Set.of(otherEmp.getId()), true);

        entityManager.flush();
        entityManager.clear();

        List<Schedule> schedules = scheduleRepository.findBySourceKey(sourceKey);

//        log.info("after remove = {}", schedules.getFirst().getScheduleParticipants()
//                .stream().map(p -> p.getEmp().getId()).toList());
//
//
//        schedules.forEach(s -> {
//            List<Long> participantIds = s.getScheduleParticipants().stream()
//                    .map(p -> p.getEmp().getId())
//                    .toList();
//
//            log.info("scheduleId={}, sourceKey={}, date={}, participants={} : id랑 날짜만 달라야함",
//                    s.getId(),
//                    s.getSourceKey(),
//                    s.getScheduleDate(),
//                    participantIds);
//        });

//        schedules.forEach(s -> {
//            List<Long> participantIds = s.getScheduleParticipants().stream()
//                    .map(p -> p.getEmp().getId())
//                    .toList();
//
//            // 왜 orphan 상태인데 컬렉션에 그대로 있는 것이냐.. <- add랑 remove를 같은 영속성 컨테이너에서 해서 그럼
//            log.info("최종 result scheduleId={}, date={}, participants={}",
//                    s.getId(),
//                    s.getScheduleDate(),
//                    participantIds);
//        });
        schedules.forEach(s -> {
            Set<Long> participants = s.getScheduleParticipants().stream()
                    .map(p -> p.getEmp().getId())
                    .collect(Collectors.toSet());

            assertThat(participants).doesNotContain(otherEmp.getId());
            assertThat(participants).contains(register.getId());
        });
    }

    @Transactional
    @Test
    @DisplayName("단일 이벤트 취소 - isForBulkEdit=false.")
    void cancel_single_schedule_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();

        entityManager.flush();
        entityManager.clear();

        scheduleRegister.cancelSchedule(firstDayOfSchedule.getId(), false);

        entityManager.flush();
        entityManager.clear();

        Schedule updatedSchedule = scheduleRepository.findById(firstDayOfSchedule.getId()).orElseThrow();
        List<Schedule> otherDaysOfCancelledDaySchedule = scheduleRepository.findBySourceKey(updatedSchedule.getSourceKey());
        otherDaysOfCancelledDaySchedule.remove(updatedSchedule);

        assertThat(updatedSchedule.isCanceled())
                .as("해당 일정 중 특정일 취소 확인")
                .isTrue();

        otherDaysOfCancelledDaySchedule.forEach(s -> {
            assertThat(s.isCanceled())
                    .as("해당 일정 중 특정일 외는 취소 x")
                    .isFalse();
        });


    }
    
    @Test
    @Transactional
    @DisplayName("동일 이벤트 전체 일정 취소 - isForBulkEdit=true")
    void cancel_same_event_schedules_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();

        entityManager.flush();
        entityManager.clear();

        scheduleRegister.cancelSchedule(firstDayOfSchedule.getId(), true);

        entityManager.flush();
        entityManager.clear();

        List<Schedule> updatedSchedule = scheduleRepository.findBySourceKey(firstDayOfSchedule.getSourceKey());


        updatedSchedule.forEach(s -> {
            assertThat(s.isCanceled())
                    .as("모든 일정 취소")
                    .isTrue();
        });
    }

    @Transactional
    @Test
    @DisplayName("단일 일정 수정 - isForBulkEdit = false")
    void update_single_event_manual_schedules_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();
        String sourceKey = firstDayOfSchedule.getSourceKey();

        entityManager.flush();
        entityManager.clear();

        String editedTitle = "editedTitle9";
        String editedContent = "editedContent9";
        LocalDateTime editedStartAt = LocalDateTime.of(firstDayOfSchedule.getScheduleDate(), LocalTime.of(13, 0));
        LocalDateTime editedEndAt = LocalDateTime.of(firstDayOfSchedule.getScheduleDate(), LocalTime.of(14, 0));
        scheduleRegister.updateManualSchedule(
                firstDayOfSchedule.getId(), false, 
                ManualScheduleParam.builder()
                        .ownerId(register.getId()).title(editedTitle).content(editedContent).startAt(editedStartAt).endAt(editedEndAt)
                .build()
        );

        entityManager.flush();
        entityManager.clear();

        List<Schedule> updatedSchedules = scheduleRepository.findBySourceKey(sourceKey);
        Schedule updatedSchedule = scheduleRepository.findById(firstDayOfSchedule.getId()).orElseThrow();
        updatedSchedules.remove(updatedSchedule);

        assertThat(updatedSchedule).extracting(
                Schedule::getTitle, Schedule::getContent, Schedule::getStartAt, Schedule::getEndAt
        ).containsExactly(
                editedTitle, editedContent, editedStartAt.toLocalTime(), editedEndAt.toLocalTime()
        );

        updatedSchedules.forEach(s -> {
//            log.info("title = {}, content = {}, startAt = {}, endAt = {}",s.getTitle(), s.getContent(), s.getStartAt(), s.getEndAt());

            assertNotEquals(editedTitle, s.getTitle());
            assertNotEquals(editedContent, s.getContent());
            assertNotEquals(editedStartAt, s.getStartAt());
            assertNotEquals(editedEndAt, s.getEndAt());
        });
    }

    @Transactional
    @Test
    @DisplayName("동일 일정 수정 - isForBulkEdit = true 시, 같은 sourceKey의 일정 정보가 다 바뀐다.")
    void update_same_event_manual_schedules_success() {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");
        List<Schedule> manualSchedules = getManualSchedules(
                register,
                LocalDateTime.of(BASE_DATE, START_TIME),
                LocalDateTime.of(BASE_DATE, END_TIME).plusDays(2)
        );

        Schedule firstDayOfSchedule = manualSchedules.getFirst();
        String sourceKey = firstDayOfSchedule.getSourceKey();

        entityManager.flush();
        entityManager.clear();

        String editedTitle = "editedTitle9";
        String editedContent = "editedContent9";
        LocalDateTime editedStartAt = LocalDateTime.of(firstDayOfSchedule.getScheduleDate(), LocalTime.of(13, 0));
        LocalDateTime editedEndAt = LocalDateTime.of(firstDayOfSchedule.getScheduleDate(), LocalTime.of(14, 0));

        scheduleRegister.updateManualSchedule(
                firstDayOfSchedule.getId(), true,
                ManualScheduleParam.builder()
                        .ownerId(register.getId()).title(editedTitle).content(editedContent).startAt(editedStartAt).endAt(editedEndAt)
                        .build()
        );

        entityManager.flush();
        entityManager.clear();

        List<Schedule> updatedSchedules = scheduleRepository.findBySourceKey(sourceKey);

        updatedSchedules.forEach(s -> {
            assertThat(s).extracting(
                    Schedule::getTitle, Schedule::getContent, Schedule::getStartAt, Schedule::getEndAt
            ).containsExactly(
                    editedTitle, editedContent, editedStartAt.toLocalTime(), editedEndAt.toLocalTime()
            );
        });
    }

    private static Stream<Arguments> variousScheduleTimes() {
        LocalDate baseDate = BASE_DATE;

        return Stream.of(
                Arguments.of(
                        "단일 날짜 일정",
                        LocalDateTime.of(baseDate, LocalTime.of(10, 0)),
                        LocalDateTime.of(baseDate, LocalTime.of(11, 0)),
                        List.of(
                                new ExpectedScheduleTime(
                                        baseDate,
                                        LocalTime.of(10, 0),
                                        LocalTime.of(11, 0),
                                        false
                                )
                        )
                ),
                Arguments.of(
                        "2일 일정 - 시작일은 시작시각부터 퇴근시간까지, 종료일은 출근시간부터 종료시각까지",
                        LocalDateTime.of(baseDate, LocalTime.of(13, 0)),
                        LocalDateTime.of(baseDate.plusDays(1), LocalTime.of(14, 0)),
                        List.of(
                                new ExpectedScheduleTime(
                                        baseDate,
                                        LocalTime.of(13, 0),
                                        LocalTime.of(18, 0),
                                        false
                                ),
                                new ExpectedScheduleTime(
                                        baseDate.plusDays(1),
                                        LocalTime.of(9, 0),
                                        LocalTime.of(14, 0),
                                        false
                                )
                        )
                ),
                Arguments.of(
                        "3일 일정 - 중간일은 전일 일정",
                        LocalDateTime.of(baseDate, LocalTime.of(13, 0)),
                        LocalDateTime.of(baseDate.plusDays(2), LocalTime.of(14, 0)),
                        List.of(
                                new ExpectedScheduleTime(
                                        baseDate,
                                        LocalTime.of(13, 0),
                                        LocalTime.of(18, 0),
                                        false
                                ),
                                new ExpectedScheduleTime(
                                        baseDate.plusDays(1),
                                        LocalTime.of(9, 0),
                                        LocalTime.of(18, 0),
                                        true
                                ),
                                new ExpectedScheduleTime(
                                        baseDate.plusDays(2),
                                        LocalTime.of(9, 0),
                                        LocalTime.of(14, 0),
                                        false
                                )
                        )
                ),
                Arguments.of(
                        "근무시간 전체를 채운 2일 일정",
                        LocalDateTime.of(baseDate, LocalTime.of(9, 0)),
                        LocalDateTime.of(baseDate.plusDays(1), LocalTime.of(18, 0)),
                        List.of(
                                new ExpectedScheduleTime(
                                        baseDate,
                                        LocalTime.of(9, 0),
                                        LocalTime.of(18, 0),
                                        true
                                ),
                                new ExpectedScheduleTime(
                                        baseDate.plusDays(1),
                                        LocalTime.of(9, 0),
                                        LocalTime.of(18, 0),
                                        true
                                )
                        )
                )
        );
    }

    @Transactional
    @ParameterizedTest(name = "{index} ==> {0}")
    @MethodSource("variousScheduleTimes")
    @DisplayName("여러 날짜 일정 시간 계산")
    void register_multi_day_schedule_split_by_company_work_time_success(
            String description,
            LocalDateTime startAt,
            LocalDateTime endAt,
            List<ExpectedScheduleTime> expectedTimes
    ) {
        Emp register = saveApprovedEmp(empRepository, "202601101", "emp111");

        List<Schedule> schedules = getManualSchedules(register, startAt, endAt).stream()
                .sorted(Comparator.comparing(Schedule::getScheduleDate))
                .toList();

        assertThat(schedules)
                .as("시작일~종료일 사이 날짜 수만큼 일정이 생성된다.")
                .hasSize(expectedTimes.size());

        for (int i = 0; i < expectedTimes.size(); i++) {
            Schedule schedule = schedules.get(i);
            ExpectedScheduleTime expected = expectedTimes.get(i);

            assertThat(schedule).extracting(
                    Schedule::getScheduleDate,
                    Schedule::getStartAt,
                    Schedule::getEndAt,
                    Schedule::isAllDay
            ).containsExactly(
                    expected.scheduleDate(),
                    expected.startAt(),
                    expected.endAt(),
                    expected.isAllDay()
            );
        }
    }

    private record ExpectedScheduleTime(
            LocalDate scheduleDate,
            LocalTime startAt,
            LocalTime endAt,
            boolean isAllDay
    ) {
    }

    private List<Schedule> getManualSchedules(Emp emp, LocalDateTime startAt, LocalDateTime endAt) {
        Long ownerId = emp.getId();
        String title = "title";
        String content = "content";

        String getSourceKey = scheduleRegister.registerSchedules(
                        ManualScheduleParam.builder()
                                .ownerId(ownerId)
                                .title(title)
                                .content(content)
                                .startAt(startAt)
                                .endAt(endAt)
                                .build()
        );

        entityManager.flush();
        entityManager.clear();

        return scheduleRepository.findBySourceKey(getSourceKey);
    }


}