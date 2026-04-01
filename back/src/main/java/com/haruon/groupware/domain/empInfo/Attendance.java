package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public class Attendance extends AbstractEntity {

    @ManyToOne
    @JoinColumn(name="emp_id", nullable = false)
    private Emp emp;

    @Enumerated(EnumType.STRING)
    @Nullable
    private AttendanceStatus attendanceStatus;

    private LocalDate attendanceDate;

    @Nullable
    private LocalTime startAt;

    @Nullable
    private LocalTime endAt;

    @Nullable
    private LocalDateTime approvedAt;

    @Nullable
    @ManyToOne
    @JoinColumn(name="approved_emp_id")
    private Emp approvedBy;

    @Nullable
    @ManyToOne
    @JoinColumn(name="edited_emp_id")
    private Emp editedBy;

    @Nullable
    private LocalDateTime editedAt;

    @Nullable
    private String editReason;

    // 시스템부서담당자가 수정
    public void changeAttendanceByDeptManager(
            @Nullable LocalTime startAt, @Nullable LocalTime endAt,
            @Nullable AttendanceStatus status,
            LocalDateTime editAt,
            String editReason,
            Emp editedBy,
            long requiredWorkHours
    ) {
        requireNonNull(editAt, "수정일자는 null일 수 없음");
        requireNonNull(editReason, "수정사유는 null일 수 없음");
        requireNonNull(editedBy, "수정자는 null일 수 없음");

        state(this.approvedAt == null && this.approvedBy == null, "승인 후에는 수정 불가");

        if(startAt != null || endAt != null) {
            this.startAt = startAt == null ? this.startAt : startAt;
            this.endAt = endAt == null ? this.endAt : endAt;

            state(this.startAt != null && this.endAt != null, "시작/종료 시간은 빈값이 될 수 없음");
            state(this.endAt.isAfter(this.startAt), "종료시각은 시작시각보다 늦어야 함");
        }

        if (status == AttendanceStatus.NORMAL) {
            state(this.startAt != null && this.endAt != null,
                    "정상근무로 변경하려면 시작시각과 종료시각이 모두 필요함");
            this.attendanceStatus = getStatusByRecognizedHours(this.startAt, this.endAt, requiredWorkHours);

        } else if (status != null) {
            this.attendanceStatus = status;
        }

        markEditor(emp, editedAt, editReason);
    }

    public void markEditor(Emp editedBy, LocalDateTime editedAt, String editReason) {
        this.editedBy = editedBy;
        this.editedAt = editedAt;
        this.editReason = editReason;
    }

    public static void changeAttendanceTime(Attendance attendance, LocalTime startAt, LocalTime endAt) {
        requireNonNull(startAt, "출근시각 정보 없음");
        requireNonNull(endAt, "퇴근시각 정보 없음");
        state(!endAt.isBefore(startAt), "퇴근시각은 출근시각보다 빠를 수 없음");

        attendance.startAt = startAt;
        attendance.endAt = endAt;
    }

    // 근태 승인(확정)
    public void approveAttendance(Emp approver, LocalDateTime approvedAt) {
        state(this.approvedAt == null && this.approvedBy == null, "승인 후에는 승인 불가");

        this.approvedBy = approver;
        this.approvedAt = approvedAt;
    }

    // 출근찍을때 기록
    public static Attendance registerAttendanceByEmp(Emp emp, LocalDateTime startAt) {
        Attendance attendance = new Attendance();

        attendance.emp = requireNonNull(emp);
        attendance.attendanceDate = requireNonNull(startAt.toLocalDate());
        attendance.startAt = requireNonNull(startAt.toLocalTime());

        return attendance;
    }

    // 퇴근찍을때 객체 수정
    public void recordEndAtByEmp(LocalDateTime endAt) {
        state(this.startAt!= null ,"당일 출근기록 없음");
        state(endAt != null, "퇴근시각 미입력");
        state(!endAt.toLocalTime().isBefore(this.startAt), "퇴근시각은 출근시각보다 빠를 수 없음");

        this.endAt = endAt.toLocalTime();
    }

    // 마감용 상태 변경 메서드
    public static void changeAttendanceStatus(Attendance attendance, AttendanceStatus status) {
        attendance.attendanceStatus = requireNonNull(status);
    }

    // 마감용 객체 생성 메서드
    public static Attendance registerAttendance(
            Emp emp,
            LocalDate date,
            AttendanceStatus status,
            @Nullable LocalTime startAt,
            @Nullable LocalTime endAt
    ) {
        Attendance attendance = new Attendance();

        attendance.emp = requireNonNull(emp);
        attendance.attendanceDate = requireNonNull(date);
        attendance.attendanceStatus = requireNonNull(status);
        attendance.startAt = startAt;
        attendance.endAt = endAt;

        return attendance;
    }

    // 시간에 따른 지각/정상근무/지각조퇴 분기
    private AttendanceStatus getStatusByRecognizedHours(
            LocalTime startAt,
            LocalTime endAt,
            long requiredWorkHours
    ) {

        long recognizedWorkHours = Duration.between(requireNonNull(startAt), endAt).toHours();

        if(recognizedWorkHours >= requiredWorkHours) {
            return AttendanceStatus.NORMAL;
        }

        if(recognizedWorkHours * 2 >= requiredWorkHours) {
            return AttendanceStatus.LATE_EARLY;
        }

        return AttendanceStatus.ABSENT;
    }



}
