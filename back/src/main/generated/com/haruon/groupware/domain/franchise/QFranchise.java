package com.haruon.groupware.domain.franchise;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QFranchise is a Querydsl query type for Franchise
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QFranchise extends EntityPathBase<Franchise> {

    private static final long serialVersionUID = 419864378L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QFranchise franchise = new QFranchise("franchise");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final StringPath address = createString("address");

    public final StringPath businessNumber = createString("businessNumber");

    public final EnumPath<BusinessStatus> businessStatus = createEnum("businessStatus", BusinessStatus.class);

    public final com.haruon.groupware.domain.shared.QEmail contactEmail;

    public final StringPath contactNumber = createString("contactNumber");

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    public final StringPath franchiseName = createString("franchiseName");

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final StringPath memo = createString("memo");

    public final StringPath ownerName = createString("ownerName");

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QFranchise(String variable) {
        this(Franchise.class, forVariable(variable), INITS);
    }

    public QFranchise(Path<? extends Franchise> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QFranchise(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QFranchise(PathMetadata metadata, PathInits inits) {
        this(Franchise.class, metadata, inits);
    }

    public QFranchise(Class<? extends Franchise> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.contactEmail = inits.isInitialized("contactEmail") ? new com.haruon.groupware.domain.shared.QEmail(forProperty("contactEmail")) : null;
        this.emp = inits.isInitialized("emp") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("emp"), inits.get("emp")) : null;
    }

}

