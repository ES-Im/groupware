package com.haruon.groupware.domain.empInfo;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QEmpFile is a Querydsl query type for EmpFile
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QEmpFile extends EntityPathBase<EmpFile> {

    private static final long serialVersionUID = -1300088390L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QEmpFile empFile = new QEmpFile("empFile");

    public final com.haruon.groupware.domain.QAbstractFileEntity _super = new com.haruon.groupware.domain.QAbstractFileEntity(this);

    public final BooleanPath active = createBoolean("active");

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final QEmp emp;

    //inherited
    public final StringPath extension = _super.extension;

    //inherited
    public final NumberPath<Long> fileSize = _super.fileSize;

    public final EnumPath<com.haruon.groupware.domain.empInfo.enums.FileType> fileType = createEnum("fileType", com.haruon.groupware.domain.empInfo.enums.FileType.class);

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final BooleanPath isActive = createBoolean("isActive");

    //inherited
    public final StringPath mimeType = _super.mimeType;

    //inherited
    public final StringPath originalName = _super.originalName;

    //inherited
    public final StringPath storedName = _super.storedName;

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QEmpFile(String variable) {
        this(EmpFile.class, forVariable(variable), INITS);
    }

    public QEmpFile(Path<? extends EmpFile> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QEmpFile(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QEmpFile(PathMetadata metadata, PathInits inits) {
        this(EmpFile.class, metadata, inits);
    }

    public QEmpFile(Class<? extends EmpFile> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.emp = inits.isInitialized("emp") ? new QEmp(forProperty("emp"), inits.get("emp")) : null;
    }

}

