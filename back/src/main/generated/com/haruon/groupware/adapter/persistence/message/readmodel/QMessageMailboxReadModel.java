package com.haruon.groupware.adapter.persistence.message.readmodel;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMessageMailboxReadModel is a Querydsl query type for MessageMailboxReadModel
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMessageMailboxReadModel extends EntityPathBase<MessageMailboxReadModel> {

    private static final long serialVersionUID = 1223094078L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMessageMailboxReadModel messageMailboxReadModel = new QMessageMailboxReadModel("messageMailboxReadModel");

    public final EnumPath<MessageBoxType> boxType = createEnum("boxType", MessageBoxType.class);

    public final DateTimePath<java.time.LocalDateTime> deletedAt = createDateTime("deletedAt", java.time.LocalDateTime.class);

    public final StringPath mailboxKey = createString("mailboxKey");

    public final com.haruon.groupware.domain.message.QMessage message;

    public final com.haruon.groupware.domain.empInfo.QEmp owner;

    public final DateTimePath<java.time.LocalDateTime> readAt = createDateTime("readAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> trashedAt = createDateTime("trashedAt", java.time.LocalDateTime.class);

    public QMessageMailboxReadModel(String variable) {
        this(MessageMailboxReadModel.class, forVariable(variable), INITS);
    }

    public QMessageMailboxReadModel(Path<? extends MessageMailboxReadModel> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMessageMailboxReadModel(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMessageMailboxReadModel(PathMetadata metadata, PathInits inits) {
        this(MessageMailboxReadModel.class, metadata, inits);
    }

    public QMessageMailboxReadModel(Class<? extends MessageMailboxReadModel> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.message = inits.isInitialized("message") ? new com.haruon.groupware.domain.message.QMessage(forProperty("message"), inits.get("message")) : null;
        this.owner = inits.isInitialized("owner") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("owner"), inits.get("owner")) : null;
    }

}

