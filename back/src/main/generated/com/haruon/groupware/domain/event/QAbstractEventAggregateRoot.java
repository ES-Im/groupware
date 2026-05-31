package com.haruon.groupware.domain.event;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;


/**
 * QAbstractEventAggregateRoot is a Querydsl query type for AbstractEventAggregateRoot
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultSupertypeSerializer")
public class QAbstractEventAggregateRoot extends EntityPathBase<AbstractEventAggregateRoot> {

    private static final long serialVersionUID = -1241374609L;

    public static final QAbstractEventAggregateRoot abstractEventAggregateRoot = new QAbstractEventAggregateRoot("abstractEventAggregateRoot");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    //inherited
    public final NumberPath<Long> id = _super.id;

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QAbstractEventAggregateRoot(String variable) {
        super(AbstractEventAggregateRoot.class, forVariable(variable));
    }

    public QAbstractEventAggregateRoot(Path<? extends AbstractEventAggregateRoot> path) {
        super(path.getType(), path.getMetadata());
    }

    public QAbstractEventAggregateRoot(PathMetadata metadata) {
        super(AbstractEventAggregateRoot.class, metadata);
    }

}

