package com.haruon.groupware.domain.franchise;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QFranchiseInquiry is a Querydsl query type for FranchiseInquiry
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QFranchiseInquiry extends EntityPathBase<FranchiseInquiry> {

    private static final long serialVersionUID = 266849581L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QFranchiseInquiry franchiseInquiry = new QFranchiseInquiry("franchiseInquiry");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final QFranchiseInquiryAnswer answer;

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    public final StringPath externalId = createString("externalId");

    public final QFranchise franchise;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final StringPath inquirerContact = createString("inquirerContact");

    public final DateTimePath<java.time.LocalDateTime> inquiryAt = createDateTime("inquiryAt", java.time.LocalDateTime.class);

    public final StringPath inquiryContent = createString("inquiryContent");

    public final StringPath inquiryTitle = createString("inquiryTitle");

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QFranchiseInquiry(String variable) {
        this(FranchiseInquiry.class, forVariable(variable), INITS);
    }

    public QFranchiseInquiry(Path<? extends FranchiseInquiry> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QFranchiseInquiry(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QFranchiseInquiry(PathMetadata metadata, PathInits inits) {
        this(FranchiseInquiry.class, metadata, inits);
    }

    public QFranchiseInquiry(Class<? extends FranchiseInquiry> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.answer = inits.isInitialized("answer") ? new QFranchiseInquiryAnswer(forProperty("answer"), inits.get("answer")) : null;
        this.emp = inits.isInitialized("emp") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("emp"), inits.get("emp")) : null;
        this.franchise = inits.isInitialized("franchise") ? new QFranchise(forProperty("franchise"), inits.get("franchise")) : null;
    }

}

