package com.haruon.groupware.domain.meeting;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMeetingParticipant is a Querydsl query type for MeetingParticipant
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMeetingParticipant extends EntityPathBase<MeetingParticipant> {

    private static final long serialVersionUID = -725349347L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMeetingParticipant meetingParticipant = new QMeetingParticipant("meetingParticipant");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final QMeeting meeting;

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QMeetingParticipant(String variable) {
        this(MeetingParticipant.class, forVariable(variable), INITS);
    }

    public QMeetingParticipant(Path<? extends MeetingParticipant> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMeetingParticipant(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMeetingParticipant(PathMetadata metadata, PathInits inits) {
        this(MeetingParticipant.class, metadata, inits);
    }

    public QMeetingParticipant(Class<? extends MeetingParticipant> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.emp = inits.isInitialized("emp") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("emp"), inits.get("emp")) : null;
        this.meeting = inits.isInitialized("meeting") ? new QMeeting(forProperty("meeting"), inits.get("meeting")) : null;
    }

}

