package com.haruon.groupware.domain.draft;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QCirculation is a Querydsl query type for Circulation
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QCirculation extends EntityPathBase<Circulation> {

    private static final long serialVersionUID = 1816736040L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QCirculation circulation = new QCirculation("circulation");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final QDraft draft;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final DateTimePath<java.time.LocalDateTime> readAt = createDateTime("readAt", java.time.LocalDateTime.class);

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public final com.haruon.groupware.domain.empInfo.QEmp viewer;

    public QCirculation(String variable) {
        this(Circulation.class, forVariable(variable), INITS);
    }

    public QCirculation(Path<? extends Circulation> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QCirculation(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QCirculation(PathMetadata metadata, PathInits inits) {
        this(Circulation.class, metadata, inits);
    }

    public QCirculation(Class<? extends Circulation> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.draft = inits.isInitialized("draft") ? new QDraft(forProperty("draft"), inits.get("draft")) : null;
        this.viewer = inits.isInitialized("viewer") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("viewer"), inits.get("viewer")) : null;
    }

}

