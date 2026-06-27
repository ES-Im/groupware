package com.haruon.groupware.adapter.persistence.schedule;

import com.haruon.groupware.application.schedule.required.ScheduleQueryRepository;
import com.haruon.groupware.application.schedule.service.query.dto.ScheduleDetailResponse;
import com.haruon.groupware.application.schedule.service.query.dto.ScheduleResponse;
import com.haruon.groupware.domain.employee.QDept;
import com.haruon.groupware.domain.employee.QEmp;
import com.haruon.groupware.domain.employee.QEmpBelongings;
import com.haruon.groupware.domain.schedule.QSchedule;
import com.haruon.groupware.domain.schedule.QScheduleParticipant;
import com.haruon.groupware.domain.schedule.ScheduleType;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class ScheduleQueryRepositoryAdapter implements ScheduleQueryRepository {

    private final JPAQueryFactory query;
    private final QScheduleParticipant participant = QScheduleParticipant.scheduleParticipant;
    private final QSchedule schedule = QSchedule.schedule;

    @Override
    public List<Long> findScheduleParticipantsByScheduleId(Long scheduleId) {
        return query
                .select(participant.emp.id)
                .from(participant)
                .where(participant.schedule.id.eq(scheduleId))
                .fetch();
    }

    @Override
    public Optional<Long> countScheduleParticipantsByScheduleId(Long scheduleId) {
        return Optional.ofNullable(query
                .select(participant.id.count())
                .from(participant)
                .where(participant.schedule.id.eq(scheduleId))
                .fetchOne());
    }

    @Override
    public List<ScheduleResponse> findSchedulesByParticipantEmpId(
            Long empId,
            LocalDateTime targetStart,
            LocalDateTime targetEnd,
            @Nullable ScheduleType scheduleType
    ) {
        return query
                .select(Projections.constructor(
                        ScheduleResponse.class,
                        schedule.id, schedule.scheduleType, schedule.title, schedule.scheduleDate,
                        schedule.startAt, schedule.endAt, schedule.isAllDay, schedule.isCanceled
                ))
                .from(schedule)
                .where(
                        isEmpParticipant(empId),
                        checkDateTime(targetStart, targetEnd),
                        scheduleTypeEq(scheduleType)
                )
                .orderBy(schedule.scheduleDate.asc(), schedule.startAt.asc(), schedule.id.asc())
                .fetch();
    }

    @Override
    public Optional<ScheduleDetailResponse> findScheduleDetailsByIdAndEmpId(
            Long scheduleId,
            Long empId
    ) {
        QEmp owner = new QEmp("Owner");
        QEmpBelongings ownerBelongings = new QEmpBelongings("OwnerBelongings");
        QDept ownerDept = new QDept("OwnerDept");

        QEmp participantEmp = new QEmp("participant");
        QEmpBelongings participantBelongings = new QEmpBelongings("participantBelongings");
        QDept participantDept = new QDept("participantDept");

        Optional<ScheduleDetailResponse.ScheduleDetail> scheduleDetail = Optional.ofNullable(query
                .select(Projections.constructor(
                        ScheduleDetailResponse.ScheduleDetail.class,
                        schedule.id, schedule.scheduleType,
                        owner.id, ownerDept.deptName, owner.empName, owner.id.eq(empId),
                        schedule.title, schedule.content, schedule.scheduleDate, schedule.startAt, schedule.endAt,
                        schedule.isAllDay, schedule.isCanceled,

                        schedule.scheduleParticipants.size()
                ))
                .from(schedule)
                .join(schedule.emp, owner)
                .leftJoin(owner.empBelongings, ownerBelongings).on(ownerBelongings.isPrimary.isTrue(), ownerBelongings.endAt.isNull())
                .leftJoin(ownerBelongings.dept, ownerDept)
                .where(
                        schedule.id.eq(scheduleId),
                        isEmpParticipant(empId)
                ).fetchOne()
        );

        if(scheduleDetail.isEmpty()) return Optional.empty();

        List<ScheduleDetailResponse.ParticipantResponse> participants = query
                .select(Projections.constructor(
                        ScheduleDetailResponse.ParticipantResponse.class,
                        participantEmp.id, participantDept.deptName, participantEmp.empName
                ))
                .from(schedule)
                .join(schedule.scheduleParticipants, participant)
                .join(participant.emp, participantEmp)
                .leftJoin(participantEmp.empBelongings, participantBelongings).on(participantBelongings.isPrimary.isTrue(), participantBelongings.endAt.isNull())
                .leftJoin(participantBelongings.dept, participantDept)
                .where(
                        schedule.id.eq(scheduleId)
                )
                .orderBy(participantEmp.empName.asc(), participantEmp.id.asc())
                .fetch();

        return Optional.of(new ScheduleDetailResponse(scheduleDetail.get(), participants));
    }


    private BooleanExpression isEmpParticipant(Long empId) {
        QScheduleParticipant accessibleParticipant = new QScheduleParticipant("accessibleParticipant");

        return JPAExpressions
                .selectOne()
                .from(accessibleParticipant)
                .where(
                        accessibleParticipant.schedule.id.eq(schedule.id),
                        accessibleParticipant.emp.id.eq(empId)
                )
                .exists();
    }

    private BooleanExpression checkDateTime(
            LocalDateTime targetStart, LocalDateTime targetEnd
    ) {
        LocalDate startDate = targetStart.toLocalDate();
        LocalTime startTime = targetStart.toLocalTime();
        LocalDate endDate = targetEnd.toLocalDate();
        LocalTime endTime = targetEnd.toLocalTime();

        BooleanExpression endsAfterStart = schedule.scheduleDate.gt(startDate)
                .or(schedule.scheduleDate.eq(startDate).and(schedule.endAt.gt(startTime)));
        BooleanExpression startsBeforeEnd = schedule.scheduleDate.lt(endDate)
                .or(schedule.scheduleDate.eq(endDate).and(schedule.startAt.lt(endTime)));

        return endsAfterStart.and(startsBeforeEnd);
    }

    private @Nullable BooleanExpression scheduleTypeEq(@Nullable ScheduleType scheduleType) {
        return scheduleType == null ? null : schedule.scheduleType.eq(scheduleType);
    }

}
