package com.haruon.groupware.domain.sync;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QFranchiseSyncRequest is a Querydsl query type for FranchiseSyncRequest
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QFranchiseSyncRequest extends EntityPathBase<FranchiseSyncRequest> {

    private static final long serialVersionUID = 2002379640L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QFranchiseSyncRequest franchiseSyncRequest = new QFranchiseSyncRequest("franchiseSyncRequest");

    public final QSyncRequest _super = new QSyncRequest(this);

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

    public QFranchiseSyncRequest(String variable) {
        this(FranchiseSyncRequest.class, forVariable(variable), INITS);
    }

    public QFranchiseSyncRequest(Path<? extends FranchiseSyncRequest> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QFranchiseSyncRequest(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QFranchiseSyncRequest(PathMetadata metadata, PathInits inits) {
        this(FranchiseSyncRequest.class, metadata, inits);
    }

    public QFranchiseSyncRequest(Class<? extends FranchiseSyncRequest> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.education = inits.isInitialized("education") ? new com.haruon.groupware.domain.franchise.QEducation(forProperty("education"), inits.get("education")) : null;
        this.franchise = inits.isInitialized("franchise") ? new com.haruon.groupware.domain.franchise.QFranchise(forProperty("franchise"), inits.get("franchise")) : null;
    }

}

