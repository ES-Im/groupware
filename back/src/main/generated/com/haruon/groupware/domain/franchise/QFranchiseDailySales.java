package com.haruon.groupware.domain.franchise;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QFranchiseDailySales is a Querydsl query type for FranchiseDailySales
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QFranchiseDailySales extends EntityPathBase<FranchiseDailySales> {

    private static final long serialVersionUID = -1585275571L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QFranchiseDailySales franchiseDailySales = new QFranchiseDailySales("franchiseDailySales");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final StringPath externalId = createString("externalId");

    public final QFranchise franchise;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final NumberPath<Long> orderCount = createNumber("orderCount", Long.class);

    public final NumberPath<Long> salesAmount = createNumber("salesAmount", Long.class);

    public final DatePath<java.time.LocalDate> salesDate = createDate("salesDate", java.time.LocalDate.class);

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QFranchiseDailySales(String variable) {
        this(FranchiseDailySales.class, forVariable(variable), INITS);
    }

    public QFranchiseDailySales(Path<? extends FranchiseDailySales> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QFranchiseDailySales(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QFranchiseDailySales(PathMetadata metadata, PathInits inits) {
        this(FranchiseDailySales.class, metadata, inits);
    }

    public QFranchiseDailySales(Class<? extends FranchiseDailySales> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.franchise = inits.isInitialized("franchise") ? new QFranchise(forProperty("franchise"), inits.get("franchise")) : null;
    }

}

