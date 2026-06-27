package com.haruon.groupware.domain.employee;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QDeptLeader is a Querydsl query type for DeptLeader
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QDeptLeader extends EntityPathBase<DeptLeader> {

    private static final long serialVersionUID = 1416775644L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QDeptLeader deptLeader = new QDeptLeader("deptLeader");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final BooleanPath current = createBoolean("current");

    public final QDept dept;

    public final QEmp emp;

    public final DatePath<java.time.LocalDate> endAt = createDate("endAt", java.time.LocalDate.class);

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final DatePath<java.time.LocalDate> startAt = createDate("startAt", java.time.LocalDate.class);

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QDeptLeader(String variable) {
        this(DeptLeader.class, forVariable(variable), INITS);
    }

    public QDeptLeader(Path<? extends DeptLeader> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QDeptLeader(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QDeptLeader(PathMetadata metadata, PathInits inits) {
        this(DeptLeader.class, metadata, inits);
    }

    public QDeptLeader(Class<? extends DeptLeader> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.dept = inits.isInitialized("dept") ? new QDept(forProperty("dept"), inits.get("dept")) : null;
        this.emp = inits.isInitialized("emp") ? new QEmp(forProperty("emp"), inits.get("emp")) : null;
    }

}

