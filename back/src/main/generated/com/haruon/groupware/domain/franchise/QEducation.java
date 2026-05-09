package com.haruon.groupware.domain.franchise;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QEducation is a Querydsl query type for Education
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QEducation extends EntityPathBase<Education> {

    private static final long serialVersionUID = -443395259L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QEducation education = new QEducation("education");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final NumberPath<Long> capacity = createNumber("capacity", Long.class);

    public final StringPath content = createString("content");

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final ListPath<EducationApplication, QEducationApplication> educationApplications = this.<EducationApplication, QEducationApplication>createList("educationApplications", EducationApplication.class, QEducationApplication.class, PathInits.DIRECT2);

    public final DateTimePath<java.time.LocalDateTime> educationDate = createDateTime("educationDate", java.time.LocalDateTime.class);

    public final ListPath<EducationFile, QEducationFile> educationFiles = this.<EducationFile, QEducationFile>createList("educationFiles", EducationFile.class, QEducationFile.class, PathInits.DIRECT2);

    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final BooleanPath isActive = createBoolean("isActive");

    public final StringPath place = createString("place");

    public final StringPath title = createString("title");

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QEducation(String variable) {
        this(Education.class, forVariable(variable), INITS);
    }

    public QEducation(Path<? extends Education> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QEducation(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QEducation(PathMetadata metadata, PathInits inits) {
        this(Education.class, metadata, inits);
    }

    public QEducation(Class<? extends Education> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.emp = inits.isInitialized("emp") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("emp"), inits.get("emp")) : null;
    }

}

