package com.haruon.groupware.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QCompany is a Querydsl query type for Company
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QCompany extends EntityPathBase<Company> {

    private static final long serialVersionUID = 1955266091L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QCompany company = new QCompany("company");

    public final QAbstractEntity _super = new QAbstractEntity(this);

    public final StringPath companyName = createString("companyName");

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final DateTimePath<java.time.LocalDateTime> editedAt = createDateTime("editedAt", java.time.LocalDateTime.class);

    public final StringPath homePageURL = createString("homePageURL");

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final StringPath location = createString("location");

    public final StringPath ownerName = createString("ownerName");

    public final com.haruon.groupware.domain.shared.QEmail presentedEmail;

    public final StringPath presentedExternalNo = createString("presentedExternalNo");

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QCompany(String variable) {
        this(Company.class, forVariable(variable), INITS);
    }

    public QCompany(Path<? extends Company> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QCompany(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QCompany(PathMetadata metadata, PathInits inits) {
        this(Company.class, metadata, inits);
    }

    public QCompany(Class<? extends Company> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.presentedEmail = inits.isInitialized("presentedEmail") ? new com.haruon.groupware.domain.shared.QEmail(forProperty("presentedEmail")) : null;
    }

}
