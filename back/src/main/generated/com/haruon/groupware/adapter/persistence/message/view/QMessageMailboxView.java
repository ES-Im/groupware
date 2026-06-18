package com.haruon.groupware.adapter.persistence.message.view;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMessageMailboxView is a Querydsl query type for MessageMailboxView
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMessageMailboxView extends EntityPathBase<MessageMailboxView> {

    private static final long serialVersionUID = 147176110L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMessageMailboxView messageMailboxView = new QMessageMailboxView("messageMailboxView");

    public final EnumPath<MessageBoxType> boxType = createEnum("boxType", MessageBoxType.class);

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    public final StringPath mailboxKey = createString("mailboxKey");

    public final com.haruon.groupware.domain.message.QMessage message;

    public final com.haruon.groupware.domain.empInfo.QEmp owner;

    public final DateTimePath<java.time.LocalDateTime> readAt = createDateTime("readAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> sourceId = createNumber("sourceId", Long.class);

    public final DateTimePath<java.time.LocalDateTime> trashedAt = createDateTime("trashedAt", java.time.LocalDateTime.class);

    public QMessageMailboxView(String variable) {
        this(MessageMailboxView.class, forVariable(variable), INITS);
    }

    public QMessageMailboxView(Path<? extends MessageMailboxView> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMessageMailboxView(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMessageMailboxView(PathMetadata metadata, PathInits inits) {
        this(MessageMailboxView.class, metadata, inits);
    }

    public QMessageMailboxView(Class<? extends MessageMailboxView> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.message = inits.isInitialized("message") ? new com.haruon.groupware.domain.message.QMessage(forProperty("message"), inits.get("message")) : null;
        this.owner = inits.isInitialized("owner") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("owner"), inits.get("owner")) : null;
    }

}

