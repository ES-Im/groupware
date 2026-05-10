package com.haruon.groupware.domain.message;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMessageSending is a Querydsl query type for MessageSending
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMessageSending extends EntityPathBase<MessageSending> {

    private static final long serialVersionUID = 1834828460L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMessageSending messageSending = new QMessageSending("messageSending");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final BooleanPath deleted = createBoolean("deleted");

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final QMessage message;

    public final BooleanPath trashed = createBoolean("trashed");

    public final DateTimePath<java.time.LocalDateTime> trashedAt = createDateTime("trashedAt", java.time.LocalDateTime.class);

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QMessageSending(String variable) {
        this(MessageSending.class, forVariable(variable), INITS);
    }

    public QMessageSending(Path<? extends MessageSending> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMessageSending(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMessageSending(PathMetadata metadata, PathInits inits) {
        this(MessageSending.class, metadata, inits);
    }

    public QMessageSending(Class<? extends MessageSending> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.emp = inits.isInitialized("emp") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("emp"), inits.get("emp")) : null;
        this.message = inits.isInitialized("message") ? new QMessage(forProperty("message"), inits.get("message")) : null;
    }

}

