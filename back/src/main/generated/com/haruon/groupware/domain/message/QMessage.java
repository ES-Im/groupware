package com.haruon.groupware.domain.message;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMessage is a Querydsl query type for Message
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMessage extends EntityPathBase<Message> {

    private static final long serialVersionUID = -1259918130L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMessage message = new QMessage("message");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final StringPath content = createString("content");

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final ListPath<MessageFile, QMessageFile> messageFiles = this.<MessageFile, QMessageFile>createList("messageFiles", MessageFile.class, QMessageFile.class, PathInits.DIRECT2);

    public final ListPath<MessageReceiving, QMessageReceiving> receivings = this.<MessageReceiving, QMessageReceiving>createList("receivings", MessageReceiving.class, QMessageReceiving.class, PathInits.DIRECT2);

    public final QMessageSending sending;

    public final DateTimePath<java.time.LocalDateTime> sentAt = createDateTime("sentAt", java.time.LocalDateTime.class);

    public final StringPath title = createString("title");

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QMessage(String variable) {
        this(Message.class, forVariable(variable), INITS);
    }

    public QMessage(Path<? extends Message> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMessage(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMessage(PathMetadata metadata, PathInits inits) {
        this(Message.class, metadata, inits);
    }

    public QMessage(Class<? extends Message> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.sending = inits.isInitialized("sending") ? new QMessageSending(forProperty("sending"), inits.get("sending")) : null;
    }

}

