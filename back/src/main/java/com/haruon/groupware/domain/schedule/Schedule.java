package com.haruon.groupware.domain.schedule;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"schedule_type", "source_id", "owner_emp_id", "schedule_date"})
)
public class Schedule extends AbstractEntity {

    @Nullable
    private Long sourceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ScheduleType scheduleType;

    @ManyToOne
    @JoinColumn(name = "owner_emp_id",  nullable = false)
    private Emp emp;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String content;

    @Column(nullable = false)
    LocalDate scheduleDate;

    @Column(nullable = false)
    LocalTime startAt;

    @Column(nullable = false)
    LocalTime endAt;

    @Column(nullable = false)
    private boolean isAllDay;

    @Column(nullable = false)
    private boolean isCanceled;

    @Column(nullable = false)
    private boolean isPublic;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleParticipant> scheduleParticipants = new ArrayList<>();


    public static Schedule registerSchedule(@Nullable Long sourceId, ScheduleType type, Emp emp,
                    String title, String content, LocalDate scheduleDate,
                    LocalTime startAt, LocalTime endAt, boolean isAllDay, boolean isPublic) {
        Schedule schedule = new Schedule();

        state(!endAt.isBefore(startAt), "종료시간은 시작시간보다 이를 수 없음");

        schedule.sourceId = sourceId;
        schedule.scheduleType = requireNonNull(type);
        schedule.emp = requireNonNull(emp);
        schedule.title = requireNonNull(title);
        schedule.content = requireNonNull(content);
        schedule.scheduleDate = requireNonNull(scheduleDate);
        schedule.startAt = requireNonNull(startAt);
        schedule.endAt = requireNonNull(endAt);
        schedule.isAllDay = isAllDay;
        schedule.isCanceled = false;
        schedule.isPublic = isPublic;

        return schedule;
    }

    public void cancel() {
        this.isCanceled = true;
    }

    public void addParticipant(Emp emp) {
        requireNonNull(emp);

        ScheduleParticipant participant = findParticipant(emp);
        state(participant == null, "이미 참여 중인 사원");

        this.scheduleParticipants.add(ScheduleParticipant.registerScheduleParticipant(this, emp));
    }

    public void removeParticipant(Emp emp) {
        requireNonNull(emp);

        ScheduleParticipant participant = findParticipant(emp);
        state(participant != null, "기존 참여하지 않는 사원");

        this.scheduleParticipants.remove(participant);
    }

    private ScheduleParticipant findParticipant(Emp emp) {
        return this.scheduleParticipants.stream()
                .filter(s -> s.getEmp().equals(emp))
                .findAny().orElse(null);
    }
}
