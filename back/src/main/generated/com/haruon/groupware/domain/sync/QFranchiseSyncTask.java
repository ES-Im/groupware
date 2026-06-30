package com.haruon.groupware.domain.sync;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QFranchiseSyncTask is a Querydsl query type for FranchiseSyncTask
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QFranchiseSyncTask extends EntityPathBase<FranchiseSyncTask> {

    private static final long serialVersionUID = -1233251012L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QFranchiseSyncTask franchiseSyncTask = new QFranchiseSyncTask("franchiseSyncTask");

    public final QSyncTask _super = new QSyncTask(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final com.haruon.groupware.domain.franchise.QEducation education;

    //inherited
    public final StringPath endpointPath = _super.endpointPath;

    //inherited
    public final StringPath externalId = _super.externalId;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> finishedAt = _super.finishedAt;

    public final com.haruon.groupware.domain.franchise.QFranchise franchise;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final NumberPath<Integer> itemIdx = createNumber("itemIdx", Integer.class);

    //inherited
    public final StringPath lastErrorMessage = _super.lastErrorMessage;

    //inherited
    public final BooleanPath processing = _super.processing;

    //inherited
    public final NumberPath<Integer> retryCount = _super.retryCount;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> startedAt = _super.startedAt;

    //inherited
    public final EnumPath<SyncStatus> status = _super.status;

    //inherited
    public final BooleanPath terminal = _super.terminal;

    //inherited
    public final EnumPath<SyncType> type = _super.type;

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QFranchiseSyncTask(String variable) {
        this(FranchiseSyncTask.class, forVariable(variable), INITS);
    }

    public QFranchiseSyncTask(Path<? extends FranchiseSyncTask> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QFranchiseSyncTask(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QFranchiseSyncTask(PathMetadata metadata, PathInits inits) {
        this(FranchiseSyncTask.class, metadata, inits);
    }

    public QFranchiseSyncTask(Class<? extends FranchiseSyncTask> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.education = inits.isInitialized("education") ? new com.haruon.groupware.domain.franchise.QEducation(forProperty("education"), inits.get("education")) : null;
        this.franchise = inits.isInitialized("franchise") ? new com.haruon.groupware.domain.franchise.QFranchise(forProperty("franchise"), inits.get("franchise")) : null;
    }

}

