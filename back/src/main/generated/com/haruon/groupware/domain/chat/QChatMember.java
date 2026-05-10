package com.haruon.groupware.domain.chat;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QChatMember is a Querydsl query type for ChatMember
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QChatMember extends EntityPathBase<ChatMember> {

    private static final long serialVersionUID = 1787167830L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QChatMember chatMember = new QChatMember("chatMember");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final BooleanPath bookMarked = createBoolean("bookMarked");

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final BooleanPath isBookMarked = createBoolean("isBookMarked");

    public final DateTimePath<java.time.LocalDateTime> joinedAt = createDateTime("joinedAt", java.time.LocalDateTime.class);

    public final QChatMessage lastReadMessage;

    public final QChatMessage latestReadChats;

    public final DateTimePath<java.time.LocalDateTime> leftAt = createDateTime("leftAt", java.time.LocalDateTime.class);

    public final BooleanPath participating = createBoolean("participating");

    public final QChatRoom room;

    public final StringPath roomName = createString("roomName");

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QChatMember(String variable) {
        this(ChatMember.class, forVariable(variable), INITS);
    }

    public QChatMember(Path<? extends ChatMember> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QChatMember(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QChatMember(PathMetadata metadata, PathInits inits) {
        this(ChatMember.class, metadata, inits);
    }

    public QChatMember(Class<? extends ChatMember> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.emp = inits.isInitialized("emp") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("emp"), inits.get("emp")) : null;
        this.lastReadMessage = inits.isInitialized("lastReadMessage") ? new QChatMessage(forProperty("lastReadMessage"), inits.get("lastReadMessage")) : null;
        this.latestReadChats = inits.isInitialized("latestReadChats") ? new QChatMessage(forProperty("latestReadChats"), inits.get("latestReadChats")) : null;
        this.room = inits.isInitialized("room") ? new QChatRoom(forProperty("room"), inits.get("room")) : null;
    }

}

