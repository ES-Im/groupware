package com.haruon.groupware.domain.schedule;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ScheduleParticipant extends AbstractEntity {

    private Schedule schedule;

    private Emp emp;

    static ScheduleParticipant registerScheduleParticipant(Schedule schedule, Emp emp) {
        ScheduleParticipant scheduleParticipant = new ScheduleParticipant();

        scheduleParticipant.schedule = requireNonNull(schedule);
        scheduleParticipant.emp = requireNonNull(emp);

        return scheduleParticipant;
    }

}
