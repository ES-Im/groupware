package com.haruon.groupware.domain.franchise;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QEducationFile is a Querydsl query type for EducationFile
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QEducationFile extends EntityPathBase<EducationFile> {

    private static final long serialVersionUID = 1646170721L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QEducationFile educationFile = new QEducationFile("educationFile");

    public final com.haruon.groupware.domain.QAbstractFileEntity _super = new com.haruon.groupware.domain.QAbstractFileEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final QEducation education;

    //inherited
    public final StringPath extension = _super.extension;

    //inherited
    public final NumberPath<Long> fileSize = _super.fileSize;

    //inherited
    public final NumberPath<Long> id = _super.id;

    //inherited
    public final StringPath mimeType = _super.mimeType;

    //inherited
    public final StringPath originalName = _super.originalName;

    //inherited
    public final StringPath storedName = _super.storedName;

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QEducationFile(String variable) {
        this(EducationFile.class, forVariable(variable), INITS);
    }

    public QEducationFile(Path<? extends EducationFile> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QEducationFile(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QEducationFile(PathMetadata metadata, PathInits inits) {
        this(EducationFile.class, metadata, inits);
    }

    public QEducationFile(Class<? extends EducationFile> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.education = inits.isInitialized("education") ? new QEducation(forProperty("education"), inits.get("education")) : null;
    }

}

