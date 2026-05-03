package com.haruon.groupware.domain.meeting;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMeetingRoom is a Querydsl query type for MeetingRoom
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMeetingRoom extends EntityPathBase<MeetingRoom> {

    private static final long serialVersionUID = -1316243663L;

    public static final QMeetingRoom meetingRoom = new QMeetingRoom("meetingRoom");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final NumberPath<Integer> capacity = createNumber("capacity", Integer.class);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final StringPath description = createString("description");

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final BooleanPath isAvailable = createBoolean("isAvailable");

    public final StringPath name = createString("name");

    public final ListPath<MeetingRoomFile, QMeetingRoomFile> roomFiles = this.<MeetingRoomFile, QMeetingRoomFile>createList("roomFiles", MeetingRoomFile.class, QMeetingRoomFile.class, PathInits.DIRECT2);

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QMeetingRoom(String variable) {
        super(MeetingRoom.class, forVariable(variable));
    }

    public QMeetingRoom(Path<? extends MeetingRoom> path) {
        super(path.getType(), path.getMetadata());
    }

    public QMeetingRoom(PathMetadata metadata) {
        super(MeetingRoom.class, metadata);
    }

}

