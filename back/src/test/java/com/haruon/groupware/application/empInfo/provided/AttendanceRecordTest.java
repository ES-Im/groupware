package com.haruon.groupware.application.empInfo.provided;

import com.haruon.groupware.application.empInfo.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.AttendanceRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

import static com.haruon.groupware.application.empInfo.EmpFixtureWithDB.saveApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@TestIntegrationConfig
record AttendanceRecordTest(
        AttendanceRecord attendanceRecord,
        AttendanceRepository attendanceRepository,
        EmpRepository empRepository,
        EntityManager entityManager
) {

    @AfterEach
    void tearDown() {
        attendanceRepository.deleteAll();
        empRepository.deleteAll();
    }

    @TestFactory
    @DisplayName("모든 사원은 출퇴근 기록을 남길 수 있다.")
    Collection<DynamicTest> recordCheckIn_and_CheckOut_success() {
        Emp emp = saveApprovedEmp(empRepository);

        LocalDate date = LocalDate.of(2026,4,4);
        LocalTime startAt = LocalTime.of(10,0);
        LocalTime endAt = LocalTime.of(19,0);

        return List.of(
                DynamicTest.dynamicTest("모든 사원은 본인의 출근을 기록할 수 있다.", () -> {
                    System.out.println("===== 출근 기록 쿼리 시작 =====");
                    attendanceRecord.recordCheckIn(emp.getId(), LocalDateTime.of(date, startAt));
                    System.out.println("===== 출근 기록 쿼리 종료 =====");

                    attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date).stream().findFirst().ifPresent(att -> {
                        assertThat(att.getAttendanceStatus()).isEqualTo(null);
                        assertThat(att.getStartAt()).isEqualTo(startAt);
                        assertThat(att.getEndAt()).isNull();

                    });

                }), DynamicTest.dynamicTest("모든 사원은 당일 출근을 찍은상태라면 퇴근 또한 기록할 수 있다.",() -> {
                    System.out.println("===== 퇴근 기록 쿼리 시작 =====");
                    attendanceRecord.recordCheckOut(emp.getId(), LocalDateTime.of(date, endAt));
                    System.out.println("===== 퇴근 기록 쿼리 종료 =====");

                    attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date).stream().findFirst().ifPresent(att -> {
                        assertThat(att.getAttendanceStatus()).isEqualTo(null);
                        assertThat(att.getStartAt()).isEqualTo(startAt);
                        assertThat(att.getEndAt()).isEqualTo(endAt);

                    });
                }), DynamicTest.dynamicTest("퇴근을 다시 찍을 수 있다.", () -> {
                    attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date).stream().findFirst().ifPresent(att -> {
                        System.out.println("===== 퇴근 재기록 쿼리 시작 =====");
                        attendanceRecord.rerecordEndAtByEmp(att.getId(), LocalDateTime.of(date, endAt.plusHours(1)));
                        System.out.println("===== 퇴근 재기록 쿼리 종료 =====");

                        attendanceRepository.findByEmpIdAndAttendanceDate(emp.getId(), date).stream().findFirst().ifPresent(att2 -> {
                            assertThat(att2.getEndAt()).isEqualTo(endAt.plusHours(1));
                        });
                    });

                })
        );
    }


    @Test
    @DisplayName("해당 날짜에 출근기록이 없다면, 퇴근 기록을 할 수 없다.")
    void record_checkout_without_checkIn_record_fail() {
        Emp emp = saveApprovedEmp(empRepository);

        assertThatThrownBy(() ->
                attendanceRecord.recordCheckOut(emp.getId(), LocalDateTime.of(2026,4,5, 19,0,0))
        ).isInstanceOf(IllegalStateException.class);
    }

    @Test
    @DisplayName("퇴근시간을 출근시간보다 이르게 기록할 수 없다")
    void record_earlier_endAt_than_startAt_fail() {
        LocalDate date = LocalDate.of(2026,4,4);
        LocalTime startAt = LocalTime.of(10,0);

        Emp emp = saveApprovedEmp(empRepository);
        attendanceRecord.recordCheckIn(emp.getId(), LocalDateTime.of(date, startAt));

        assertThatThrownBy(() ->
                attendanceRecord.recordCheckOut(emp.getId(), LocalDateTime.of(date, startAt.minusHours(1)))
        ).isInstanceOf(IllegalStateException.class);
    }
}