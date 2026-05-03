package com.haruon.groupware.domain.schedule;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QScheduleParticipant is a Querydsl query type for ScheduleParticipant
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QScheduleParticipant extends EntityPathBase<ScheduleParticipant> {

    private static final long serialVersionUID = 1866047767L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QScheduleParticipant scheduleParticipant = new QScheduleParticipant("scheduleParticipant");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final QSchedule schedule;

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QScheduleParticipant(String variable) {
        this(ScheduleParticipant.class, forVariable(variable), INITS);
    }

    public QScheduleParticipant(Path<? extends ScheduleParticipant> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QScheduleParticipant(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QScheduleParticipant(PathMetadata metadata, PathInits inits) {
        this(ScheduleParticipant.class, metadata, inits);
    }

    public QScheduleParticipant(Class<? extends ScheduleParticipant> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.emp = inits.isInitialized("emp") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("emp"), inits.get("emp")) : null;
        this.schedule = inits.isInitialized("schedule") ? new QSchedule(forProperty("schedule"), inits.get("schedule")) : null;
    }

}

