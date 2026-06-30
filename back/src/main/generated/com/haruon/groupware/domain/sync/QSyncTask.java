package com.haruon.groupware.domain.sync;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;


/**
 * QSyncTask is a Querydsl query type for SyncTask
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultSupertypeSerializer")
public class QSyncTask extends EntityPathBase<SyncTask> {

    private static final long serialVersionUID = 739905569L;

    public static final QSyncTask syncTask = new QSyncTask("syncTask");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final StringPath endpointPath = createString("endpointPath");

    public final StringPath externalId = createString("externalId");

    public final DateTimePath<java.time.LocalDateTime> finishedAt = createDateTime("finishedAt", java.time.LocalDateTime.class);

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final StringPath lastErrorMessage = createString("lastErrorMessage");

    public final BooleanPath processing = createBoolean("processing");

    public final NumberPath<Integer> retryCount = createNumber("retryCount", Integer.class);

    public final DateTimePath<java.time.LocalDateTime> startedAt = createDateTime("startedAt", java.time.LocalDateTime.class);

    public final EnumPath<SyncStatus> status = createEnum("status", SyncStatus.class);

    public final BooleanPath terminal = createBoolean("terminal");

    public final EnumPath<SyncType> type = createEnum("type", SyncType.class);

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QSyncTask(String variable) {
        super(SyncTask.class, forVariable(variable));
    }

    public QSyncTask(Path<? extends SyncTask> path) {
        super(path.getType(), path.getMetadata());
    }

    public QSyncTask(PathMetadata metadata) {
        super(SyncTask.class, metadata);
    }

}

