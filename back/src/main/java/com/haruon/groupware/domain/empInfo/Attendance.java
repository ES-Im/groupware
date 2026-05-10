package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.enums.AttendanceStatus;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@ToString(callSuper = true, exclude = {"emp", "approvedBy", "editedBy"})
public class Attendance extends AbstractEntity {

    private Emp emp;

    private AttendanceStatus attendanceStatus;

    private LocalDate attendanceDate;

    @Nullable private LocalTime startAt;

    @Nullable private LocalTime endAt;

    @Nullable private LocalDateTime approvedAt;

    @Nullable private Emp approvedBy;

    @Nullable private Emp editedBy;

    @Nullable private LocalDateTime editedAt;

    @Nullable private String editReason;

    public static Attendance registerAttendanceByEmp(Emp emp, LocalDateTime startAt) {
        Attendance attendance = new Attendance();

        attendance.emp = requireNonNull(emp);
        attendance.attendanceDate = requireNonNull(startAt.toLocalDate());
        attendance.startAt = requireNonNull(startAt.toLocalTime());

        return attendance;
    }

    public void recordEndAtByEmp(LocalDateTime endAt) {
        state(this.startAt!= null ,"당일 출근기록 없음");
        state(endAt != null, "퇴근시각 미입력");
        state(endAt.toLocalDate().equals(this.attendanceDate), "같은 일자인 근태 퇴근기록만 가능");
        state(!endAt.toLocalTime().isBefore(this.startAt), "퇴근시각은 출근시각보다 빠를 수 없음");

        this.endAt = endAt.toLocalTime();
    }

    public void approveAttendance(Emp approver, LocalDateTime approvedAt) {
        requireNonNull(approver, "승인자 정보 없음");
        requireNonNull(approvedAt, "승인 일시 정보 없음");
        state(this.attendanceStatus != null, "근태상태가 없으면 승인할 수 없음");
        state(!this.attendanceDate.equals(approvedAt.toLocalDate()), "같은 날짜의 근태기록을 승인할 수 없음");
        state(this.approvedAt == null && this.approvedBy == null, "승인 후에는 승인 불가");

        this.approvedBy = approver;
        this.approvedAt = approvedAt;
    }

    public void changeAttendanceByDeptManager(
            @Nullable LocalTime startAt,
            @Nullable LocalTime endAt,
            AttendanceStatus status,
            LocalDateTime editAt,
            String editReason,
            Emp editedBy
    ) {
        requireNonNull(status, "근태상태는 null일 수 없음");
        requireNonNull(editAt, "수정일자는 null일 수 없음");
        requireNonNull(editReason, "수정사유는 null일 수 없음");
        requireNonNull(editedBy, "수정자는 null일 수 없음");

        state(!editReason.isBlank(), "수정사유는 비어있을 수 없음");
        state(this.approvedAt == null && this.approvedBy == null, "승인 후에는 수정 불가");

        boolean isTimeChanged = changeTime(startAt, endAt);

        state(isTimeChanged || this.attendanceStatus != status, "수정할 내용이 없음");

        applyAttendanceStatus(status);

        markEditor(editedBy, editAt, editReason);
    }

    public void markEditor(Emp editedBy, LocalDateTime editedAt, String editReason) {
        this.editedBy = editedBy;
        this.editedAt = editedAt;
        this.editReason = editReason;
    }

    public static Attendance registerAttendance(
            Emp emp,
            LocalDate date,
            AttendanceStatus status,
            @Nullable LocalTime startAt,
            @Nullable LocalTime endAt
    ) {
        boolean timeIncluded = startAt != null && endAt != null;
        if(timeIncluded) state(!endAt.isBefore(startAt), "종료시각은 시작시각보다 빠를 수 없음");

        if(status.equals(AttendanceStatus.NORMAL) ||
                status.equals(AttendanceStatus.LATE_EARLY) ||
                status.equals(AttendanceStatus.HALF_DAY_LEAVE)) {
            state(timeIncluded, "시간 정보가 필요한 근태상태");
        }

        Attendance attendance = new Attendance();

        attendance.emp = requireNonNull(emp);
        attendance.attendanceDate = requireNonNull(date);
        attendance.attendanceStatus = requireNonNull(status);
        attendance.startAt = startAt;
        attendance.endAt = endAt;

        return attendance;
    }

    public static void changeAttendanceTime(Attendance attendance, LocalTime startAt, LocalTime endAt) {
        requireNonNull(startAt, "출근시각 정보 없음");
        requireNonNull(endAt, "퇴근시각 정보 없음");
        state(!endAt.isBefore(startAt), "퇴근시각은 출근시각보다 빠를 수 없음");

        attendance.startAt = startAt;
        attendance.endAt = endAt;
    }

    public static void changeAttendanceStatus(Attendance attendance, AttendanceStatus status) {
        attendance.attendanceStatus = requireNonNull(status);
    }


    private void applyAttendanceStatus(AttendanceStatus status) {
        if (!(status == AttendanceStatus.ALL_DAY_LEAVE
                || status == AttendanceStatus.SICK_LEAVE
                || status == AttendanceStatus.ABSENT)) {
            state(this.startAt != null && this.endAt != null,
                    "정상근무 또는 시간기반 상태는 시작시각과 종료시각이 모두 필요함");
        }

        this.attendanceStatus = status;
    }

    private boolean changeTime(LocalTime startAt, LocalTime endAt) {
        boolean isTimeChanged = startAt != null || endAt != null;

        if (isTimeChanged) {
            this.startAt = (startAt == null) ? this.startAt : startAt;
            this.endAt = (endAt == null) ? this.endAt : endAt;

            state(this.startAt != null && this.endAt != null, "시작/종료 시간은 빈값이 될 수 없음");
            state(!this.endAt.isBefore(this.startAt), "종료시각은 시작시각보다 빠를 수 없음");

            return true;
        }

        return false;
    }
}
