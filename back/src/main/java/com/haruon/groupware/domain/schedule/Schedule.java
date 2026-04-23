package com.haruon.groupware.domain.schedule;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
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
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"schedule_type", "source_key", "owner_emp_id", "schedule_date"})
)
public class Schedule extends AbstractEntity {

    @Column(nullable = false, updatable = false)
    String sourceKey;

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
    private LocalDate scheduleDate;

    @Column(nullable = false)
    private LocalTime startAt;

    @Column(nullable = false)
    private LocalTime endAt;

    @Column(nullable = false)
    private boolean isAllDay;

    @Column(nullable = false)
    private boolean isCanceled;

    @Column(nullable = false)
    private boolean isPublic;

    @OneToMany(mappedBy = "schedule", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ScheduleParticipant> scheduleParticipants = new ArrayList<>();


    public static Schedule registerSchedule(
            String sourceKey,
            ScheduleType type,
            Emp emp,
            String title, String content,
            LocalDate scheduleDate,
            LocalTime startAt, LocalTime endAt,
            boolean isAllDay, boolean isPublic) {
        Schedule schedule = new Schedule();

        schedule.startAt = requireNonNull(startAt);
        schedule.endAt = requireNonNull(endAt);
        validateTime(startAt, endAt);

        schedule.sourceKey = requireNonNull(sourceKey);
        schedule.scheduleType = requireNonNull(type);
        schedule.emp = requireNonNull(emp);
        schedule.title = requireNonNull(title);
        schedule.content = requireNonNull(content);
        schedule.scheduleDate = requireNonNull(scheduleDate);
        schedule.isAllDay = isAllDay;
        schedule.isCanceled = false;
        schedule.isPublic = isPublic;

        schedule.addParticipant(requireNonNull(emp));

        return schedule;
    }

    public int cancel() {
        if(!this.isCanceled) {
            this.isCanceled = true;

            return 1;
        }

        return 0;
    }

    public int addParticipant(Emp emp) {
        requireNonNull(emp);

        ScheduleParticipant participant = findParticipant(emp);

        if(participant == null) {
            this.scheduleParticipants.add(ScheduleParticipant.registerScheduleParticipant(this, emp));
            return 1;
        }

        return 0;
    }

    public int removeParticipant(Emp emp) {
        requireNonNull(emp);

        ScheduleParticipant participant = findParticipant(emp);

        if(participant != null) {
            this.scheduleParticipants.remove(participant);
            return 1;
        }

        return 0;
    }

    public int changeManualSchedule(
            @Nullable String title,
            @Nullable String content,
            @Nullable LocalTime startAt,
            @Nullable LocalTime endAt
    ) {

        String newTitle = (title != null) ? title : this.title;
        String newContent = (content != null) ? content : this.content;
        LocalTime newStartAt = (startAt != null) ? startAt : this.startAt;
        LocalTime newEndAt = (endAt != null) ? endAt : this.endAt;

        validateTime(newStartAt, newEndAt);

        boolean changed =
                !newTitle.equals(this.title) ||
                !newContent.equals(this.content) ||
                !newStartAt.equals(this.startAt) ||
                !newEndAt.equals(this.endAt);

        if (!changed) {
            return 0;
        }

        this.title = newTitle;
        this.content = newContent;
        this.startAt = newStartAt;
        this.endAt = newEndAt;

        return 1;
    }

    private @Nullable ScheduleParticipant findParticipant(Emp emp) {
        return this.scheduleParticipants.stream()
                .filter(s -> s.getEmp().equals(emp))
                .findAny().orElse(null);
    }

    private static void validateTime(LocalTime startAt, LocalTime endAt) {
        state(!startAt.isAfter(endAt), "종료시간은 시작시간보다 이를 수 없음");
    }
}
