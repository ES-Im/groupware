package com.haruon.groupware.domain.draft;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QBusinessTripParticipant is a Querydsl query type for BusinessTripParticipant
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QBusinessTripParticipant extends EntityPathBase<BusinessTripParticipant> {

    private static final long serialVersionUID = 1973170127L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QBusinessTripParticipant businessTripParticipant = new QBusinessTripParticipant("businessTripParticipant");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final QBusinessTripDraft businessTripDraft;

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    //inherited
    public final NumberPath<Long> id = _super.id;

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QBusinessTripParticipant(String variable) {
        this(BusinessTripParticipant.class, forVariable(variable), INITS);
    }

    public QBusinessTripParticipant(Path<? extends BusinessTripParticipant> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QBusinessTripParticipant(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QBusinessTripParticipant(PathMetadata metadata, PathInits inits) {
        this(BusinessTripParticipant.class, metadata, inits);
    }

    public QBusinessTripParticipant(Class<? extends BusinessTripParticipant> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.businessTripDraft = inits.isInitialized("businessTripDraft") ? new QBusinessTripDraft(forProperty("businessTripDraft"), inits.get("businessTripDraft")) : null;
        this.emp = inits.isInitialized("emp") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("emp"), inits.get("emp")) : null;
    }

}

