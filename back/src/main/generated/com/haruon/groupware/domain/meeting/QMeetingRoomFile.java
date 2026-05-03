package com.haruon.groupware.domain.meeting;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMeetingRoomFile is a Querydsl query type for MeetingRoomFile
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMeetingRoomFile extends EntityPathBase<MeetingRoomFile> {

    private static final long serialVersionUID = 162275405L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMeetingRoomFile meetingRoomFile = new QMeetingRoomFile("meetingRoomFile");

    public final com.haruon.groupware.domain.QAbstractFileEntity _super = new com.haruon.groupware.domain.QAbstractFileEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    //inherited
    public final StringPath extension = _super.extension;

    //inherited
    public final NumberPath<Long> fileSize = _super.fileSize;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final QMeetingRoom meetingRoom;

    //inherited
    public final StringPath mimeType = _super.mimeType;

    //inherited
    public final StringPath originalName = _super.originalName;

    //inherited
    public final StringPath storedName = _super.storedName;

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QMeetingRoomFile(String variable) {
        this(MeetingRoomFile.class, forVariable(variable), INITS);
    }

    public QMeetingRoomFile(Path<? extends MeetingRoomFile> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMeetingRoomFile(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMeetingRoomFile(PathMetadata metadata, PathInits inits) {
        this(MeetingRoomFile.class, metadata, inits);
    }

    public QMeetingRoomFile(Class<? extends MeetingRoomFile> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.meetingRoom = inits.isInitialized("meetingRoom") ? new QMeetingRoom(forProperty("meetingRoom")) : null;
    }

}

