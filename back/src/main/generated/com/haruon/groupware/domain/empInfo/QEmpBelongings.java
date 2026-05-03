package com.haruon.groupware.domain.empInfo;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QEmpBelongings is a Querydsl query type for EmpBelongings
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QEmpBelongings extends EntityPathBase<EmpBelongings> {

    private static final long serialVersionUID = -1412217778L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QEmpBelongings empBelongings = new QEmpBelongings("empBelongings");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final QDept dept;

    public final QEmp emp;

    public final DatePath<java.time.LocalDate> endAt = createDate("endAt", java.time.LocalDate.class);

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final BooleanPath isPrimary = createBoolean("isPrimary");

    public final EnumPath<com.haruon.groupware.domain.empInfo.enums.PositionCode> position = createEnum("position", com.haruon.groupware.domain.empInfo.enums.PositionCode.class);

    public final DatePath<java.time.LocalDate> startAt = createDate("startAt", java.time.LocalDate.class);

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QEmpBelongings(String variable) {
        this(EmpBelongings.class, forVariable(variable), INITS);
    }

    public QEmpBelongings(Path<? extends EmpBelongings> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QEmpBelongings(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QEmpBelongings(PathMetadata metadata, PathInits inits) {
        this(EmpBelongings.class, metadata, inits);
    }

    public QEmpBelongings(Class<? extends EmpBelongings> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.dept = inits.isInitialized("dept") ? new QDept(forProperty("dept")) : null;
        this.emp = inits.isInitialized("emp") ? new QEmp(forProperty("emp"), inits.get("emp")) : null;
    }

}

