package com.haruon.groupware.domain.empInfo;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.emp.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmpAttendance extends AbstractEntity {

    @ManyToOne
    @JoinColumn(name="emp_id", nullable = false)
    private Emp emp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttendanceStatus attendanceState;

    @Nullable
    private LocalDateTime startAt;

    @Nullable
    private LocalDateTime endAt;

    @Nullable
    private LocalDateTime approvedAt;

    @Nullable
    @ManyToOne
    @JoinColumn(name="approved_emp_id", nullable = true)
    private Emp approvedBy;

    @Nullable
    private String editReason;

}
