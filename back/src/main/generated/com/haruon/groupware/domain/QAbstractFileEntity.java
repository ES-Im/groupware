package com.haruon.groupware.domain;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;


/**
 * QAbstractFileEntity is a Querydsl query type for AbstractFileEntity
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultSupertypeSerializer")
public class QAbstractFileEntity extends EntityPathBase<AbstractFileEntity> {

    private static final long serialVersionUID = 1218660307L;

    public static final QAbstractFileEntity abstractFileEntity = new QAbstractFileEntity("abstractFileEntity");

    public final QAbstractEntity _super = new QAbstractEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final StringPath extension = createString("extension");

    public final NumberPath<Long> fileSize = createNumber("fileSize", Long.class);

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final StringPath mimeType = createString("mimeType");

    public final StringPath originalName = createString("originalName");

    public final StringPath storedName = createString("storedName");

    public final StringPath storedPath = createString("storedPath");

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QAbstractFileEntity(String variable) {
        super(AbstractFileEntity.class, forVariable(variable));
    }

    public QAbstractFileEntity(Path<? extends AbstractFileEntity> path) {
        super(path.getType(), path.getMetadata());
    }

    public QAbstractFileEntity(PathMetadata metadata) {
        super(AbstractFileEntity.class, metadata);
    }

}

