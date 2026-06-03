package com.haruon.groupware.domain.empInfo;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QDept is a Querydsl query type for Dept
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QDept extends EntityPathBase<Dept> {

    private static final long serialVersionUID = 1024967343L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QDept dept = new QDept("dept");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final BooleanPath active = createBoolean("active");

    public final BooleanPath allChildDeptsInactive = createBoolean("allChildDeptsInactive");

    public final BooleanPath allTreeInactive = createBoolean("allTreeInactive");

    public final ListPath<Dept, QDept> childDepts = this.<Dept, QDept>createList("childDepts", Dept.class, QDept.class, PathInits.DIRECT2);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final QDeptLeader currentLeader;

    public final StringPath deptCode = createString("deptCode");

    public final ListPath<DeptLeader, QDeptLeader> deptLeaders = this.<DeptLeader, QDeptLeader>createList("deptLeaders", DeptLeader.class, QDeptLeader.class, PathInits.DIRECT2);

    public final StringPath deptName = createString("deptName");

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final BooleanPath isActive = createBoolean("isActive");

    public final QDept parentDept;

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QDept(String variable) {
        this(Dept.class, forVariable(variable), INITS);
    }

    public QDept(Path<? extends Dept> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QDept(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QDept(PathMetadata metadata, PathInits inits) {
        this(Dept.class, metadata, inits);
    }

    public QDept(Class<? extends Dept> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.currentLeader = inits.isInitialized("currentLeader") ? new QDeptLeader(forProperty("currentLeader"), inits.get("currentLeader")) : null;
        this.parentDept = inits.isInitialized("parentDept") ? new QDept(forProperty("parentDept"), inits.get("parentDept")) : null;
    }

}

