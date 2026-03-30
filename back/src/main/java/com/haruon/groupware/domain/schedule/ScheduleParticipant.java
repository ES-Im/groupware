package com.haruon.groupware.domain.schedule;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"schedule_id", "participant_id"})
)
public class ScheduleParticipant extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="schedule_id", nullable=false)
    private Schedule schedule;

    @Getter(AccessLevel.PACKAGE)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id", nullable = false)
    private Emp emp;

    static ScheduleParticipant registerScheduleParticipant(Schedule schedule, Emp emp) {
        ScheduleParticipant scheduleParticipant = new ScheduleParticipant();

        scheduleParticipant.schedule = requireNonNull(schedule);
        scheduleParticipant.emp = requireNonNull(emp);

        return scheduleParticipant;
    }

}
