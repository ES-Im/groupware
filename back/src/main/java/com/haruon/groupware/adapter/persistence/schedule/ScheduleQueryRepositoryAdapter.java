package com.haruon.groupware.adapter.persistence.schedule;

import com.haruon.groupware.application.schedule.required.ScheduleQueryRepository;
import com.haruon.groupware.domain.schedule.QScheduleParticipant;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ScheduleQueryRepositoryAdapter implements ScheduleQueryRepository {

    private final JPAQueryFactory query;

    @Override
    public List<Long> findScheduleParticipantsByScheduleId(Long scheduleId) {

        QScheduleParticipant participant = QScheduleParticipant.scheduleParticipant;

        return query
                .select(participant.emp.id)
                .from(participant)
                .where(participant.schedule.id.eq(scheduleId))
                .fetch();
    }

    @Override
    public Optional<Long> countScheduleParticipantsByScheduleId(Long scheduleId) {
        QScheduleParticipant participant = QScheduleParticipant.scheduleParticipant;

        return Optional.ofNullable(query
                .select(participant.id.count())
                .from(participant)
                .where(participant.schedule.id.eq(scheduleId))
                .fetchOne());
    }
}
