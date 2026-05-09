package com.haruon.groupware.domain.message;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QMessageFile is a Querydsl query type for MessageFile
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QMessageFile extends EntityPathBase<MessageFile> {

    private static final long serialVersionUID = 1625915242L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QMessageFile messageFile = new QMessageFile("messageFile");

    public final com.haruon.groupware.domain.QAbstractFileEntity _super = new com.haruon.groupware.domain.QAbstractFileEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    //inherited
    public final StringPath extension = _super.extension;

    //inherited
    public final NumberPath<Long> fileSize = _super.fileSize;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final QMessage message;

    //inherited
    public final StringPath mimeType = _super.mimeType;

    //inherited
    public final StringPath originalName = _super.originalName;

    //inherited
    public final StringPath storedName = _super.storedName;

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QMessageFile(String variable) {
        this(MessageFile.class, forVariable(variable), INITS);
    }

    public QMessageFile(Path<? extends MessageFile> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QMessageFile(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QMessageFile(PathMetadata metadata, PathInits inits) {
        this(MessageFile.class, metadata, inits);
    }

    public QMessageFile(Class<? extends MessageFile> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.message = inits.isInitialized("message") ? new QMessage(forProperty("message"), inits.get("message")) : null;
    }

}

