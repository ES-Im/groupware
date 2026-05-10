package com.haruon.groupware.domain.schedule;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QSchedule is a Querydsl query type for Schedule
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QSchedule extends EntityPathBase<Schedule> {

    private static final long serialVersionUID = 609226876L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QSchedule schedule = new QSchedule("schedule");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final BooleanPath allDay = createBoolean("allDay");

    public final BooleanPath canceled = createBoolean("canceled");

    public final StringPath content = createString("content");

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    public final TimePath<java.time.LocalTime> endAt = createTime("endAt", java.time.LocalTime.class);

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final BooleanPath isAllDay = createBoolean("isAllDay");

    public final BooleanPath isCanceled = createBoolean("isCanceled");

    public final DatePath<java.time.LocalDate> scheduleDate = createDate("scheduleDate", java.time.LocalDate.class);

    public final SetPath<ScheduleParticipant, QScheduleParticipant> scheduleParticipants = this.<ScheduleParticipant, QScheduleParticipant>createSet("scheduleParticipants", ScheduleParticipant.class, QScheduleParticipant.class, PathInits.DIRECT2);

    public final EnumPath<ScheduleType> scheduleType = createEnum("scheduleType", ScheduleType.class);

    public final StringPath sourceKey = createString("sourceKey");

    public final TimePath<java.time.LocalTime> startAt = createTime("startAt", java.time.LocalTime.class);

    public final StringPath title = createString("title");

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QSchedule(String variable) {
        this(Schedule.class, forVariable(variable), INITS);
    }

    public QSchedule(Path<? extends Schedule> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QSchedule(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QSchedule(PathMetadata metadata, PathInits inits) {
        this(Schedule.class, metadata, inits);
    }

    public QSchedule(Class<? extends Schedule> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.emp = inits.isInitialized("emp") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("emp"), inits.get("emp")) : null;
    }

}

