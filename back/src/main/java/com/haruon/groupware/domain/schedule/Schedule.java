package com.haruon.groupware.domain.schedule;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.Getter;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Set;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@ToString(callSuper = true, exclude = "scheduleParticipants")
public class Schedule extends AbstractEntity {

    String sourceKey;

    private ScheduleType scheduleType;

    private Emp emp;

    private String title;

    private String content;

    private LocalDate scheduleDate;

    private LocalTime startAt;

    private LocalTime endAt;

    private boolean isAllDay;

    private boolean isCanceled;

    private Set<ScheduleParticipant> scheduleParticipants = new HashSet<>();


    public static Schedule registerSchedule(
            String sourceKey,
            ScheduleType type,
            Emp emp,
            String title, String content,
            LocalDate scheduleDate,
            LocalTime startAt, LocalTime endAt,
            boolean isAllDay) {
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
        System.out.println("startAt = " + startAt + ", endAt = " + endAt);

        requireNonNull(startAt, "시작시간 필수");
        requireNonNull(endAt, "종료시간 필수");

        state(!startAt.isAfter(endAt), "종료시간은 시작시간보다 이를 수 없음");
    }
}
