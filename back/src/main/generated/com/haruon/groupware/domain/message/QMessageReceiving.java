package com.haruon.groupware.domain.message;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMessageReceiving is a Querydsl query type for MessageReceiving
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMessageReceiving extends EntityPathBase<MessageReceiving> {

    private static final long serialVersionUID = -1297687118L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMessageReceiving messageReceiving = new QMessageReceiving("messageReceiving");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final BooleanPath deleted = createBoolean("deleted");

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final QMessage message;

    public final BooleanPath read = createBoolean("read");

    public final DateTimePath<java.time.LocalDateTime> readAt = createDateTime("readAt", java.time.LocalDateTime.class);

    public final BooleanPath trashed = createBoolean("trashed");

    public final DateTimePath<java.time.LocalDateTime> trashedAt = createDateTime("trashedAt", java.time.LocalDateTime.class);

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QMessageReceiving(String variable) {
        this(MessageReceiving.class, forVariable(variable), INITS);
    }

    public QMessageReceiving(Path<? extends MessageReceiving> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMessageReceiving(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMessageReceiving(PathMetadata metadata, PathInits inits) {
        this(MessageReceiving.class, metadata, inits);
    }

    public QMessageReceiving(Class<? extends MessageReceiving> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.emp = inits.isInitialized("emp") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("emp"), inits.get("emp")) : null;
        this.message = inits.isInitialized("message") ? new QMessage(forProperty("message"), inits.get("message")) : null;
    }

}

