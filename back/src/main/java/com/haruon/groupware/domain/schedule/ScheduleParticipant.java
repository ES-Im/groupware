package com.haruon.groupware.domain.schedule;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.emp.Emp;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ScheduleParticipant extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="schedule_id", nullable=false)
    private Schedule schedule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participant_id")
    private Emp emp;

    static ScheduleParticipant registerScheduleParticipant(Schedule scheduleId, Emp emp) {
        ScheduleParticipant scheduleParticipant = new ScheduleParticipant();

        scheduleParticipant.emp = requireNonNull(emp);
        scheduleParticipant.schedule = requireNonNull(scheduleId);

        return scheduleParticipant;
    }
}
