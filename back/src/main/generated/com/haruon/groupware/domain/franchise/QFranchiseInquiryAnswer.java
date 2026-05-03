package com.haruon.groupware.domain.franchise;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QFranchiseInquiryAnswer is a Querydsl query type for FranchiseInquiryAnswer
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QFranchiseInquiryAnswer extends EntityPathBase<FranchiseInquiryAnswer> {

    private static final long serialVersionUID = 1707189067L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QFranchiseInquiryAnswer franchiseInquiryAnswer = new QFranchiseInquiryAnswer("franchiseInquiryAnswer");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final DateTimePath<java.time.LocalDateTime> answeredAt = createDateTime("answeredAt", java.time.LocalDateTime.class);

    public final StringPath content = createString("content");

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final QFranchiseInquiry inquiry;

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QFranchiseInquiryAnswer(String variable) {
        this(FranchiseInquiryAnswer.class, forVariable(variable), INITS);
    }

    public QFranchiseInquiryAnswer(Path<? extends FranchiseInquiryAnswer> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QFranchiseInquiryAnswer(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QFranchiseInquiryAnswer(PathMetadata metadata, PathInits inits) {
        this(FranchiseInquiryAnswer.class, metadata, inits);
    }

    public QFranchiseInquiryAnswer(Class<? extends FranchiseInquiryAnswer> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.inquiry = inits.isInitialized("inquiry") ? new QFranchiseInquiry(forProperty("inquiry"), inits.get("inquiry")) : null;
    }

}

