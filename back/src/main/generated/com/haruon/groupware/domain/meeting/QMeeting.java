package com.haruon.groupware.domain.meeting;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMeeting is a Querydsl query type for Meeting
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMeeting extends EntityPathBase<Meeting> {

    private static final long serialVersionUID = 777669942L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMeeting meeting = new QMeeting("meeting");

    public final BooleanPath cancel = createBoolean("cancel");

    public final SimplePath<Object> editableDate = createSimple("editableDate", Object.class);

    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    public final TimePath<java.time.LocalTime> endAt = createTime("endAt", java.time.LocalTime.class);

    public final BooleanPath isCancel = createBoolean("isCancel");

    public final DatePath<java.time.LocalDate> meetingDate = createDate("meetingDate", java.time.LocalDate.class);

    public final ListPath<MeetingParticipant, QMeetingParticipant> meetingParticipants = this.<MeetingParticipant, QMeetingParticipant>createList("meetingParticipants", MeetingParticipant.class, QMeetingParticipant.class, PathInits.DIRECT2);

    public final QMeetingRoom meetingRoom;

    public final StringPath sourceKey = createString("sourceKey");

    public final TimePath<java.time.LocalTime> startAt = createTime("startAt", java.time.LocalTime.class);

    public final StringPath title = createString("title");

    public QMeeting(String variable) {
        this(Meeting.class, forVariable(variable), INITS);
    }

    public QMeeting(Path<? extends Meeting> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMeeting(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMeeting(PathMetadata metadata, PathInits inits) {
        this(Meeting.class, metadata, inits);
    }

    public QMeeting(Class<? extends Meeting> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.emp = inits.isInitialized("emp") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("emp"), inits.get("emp")) : null;
        this.meetingRoom = inits.isInitialized("meetingRoom") ? new QMeetingRoom(forProperty("meetingRoom")) : null;
    }

}

