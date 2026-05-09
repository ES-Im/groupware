package com.haruon.groupware.domain.franchise;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QEducationApplication is a Querydsl query type for EducationApplication
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QEducationApplication extends EntityPathBase<EducationApplication> {

    private static final long serialVersionUID = -1229255477L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QEducationApplication educationApplication = new QEducationApplication("educationApplication");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final DateTimePath<java.time.LocalDateTime> appliedAt = createDateTime("appliedAt", java.time.LocalDateTime.class);

    public final NumberPath<Long> appliedCount = createNumber("appliedCount", Long.class);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final QEducation education;

    public final StringPath externalId = createString("externalId");

    public final QFranchise franchise;

    //inherited
    public final NumberPath<Long> id = _super.id;

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QEducationApplication(String variable) {
        this(EducationApplication.class, forVariable(variable), INITS);
    }

    public QEducationApplication(Path<? extends EducationApplication> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QEducationApplication(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QEducationApplication(PathMetadata metadata, PathInits inits) {
        this(EducationApplication.class, metadata, inits);
    }

    public QEducationApplication(Class<? extends EducationApplication> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.education = inits.isInitialized("education") ? new QEducation(forProperty("education"), inits.get("education")) : null;
        this.franchise = inits.isInitialized("franchise") ? new QFranchise(forProperty("franchise"), inits.get("franchise")) : null;
    }

}

