package com.haruon.groupware.domain.empInfo;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;


/**
 * QDept is a Querydsl query type for Dept
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QDept extends EntityPathBase<Dept> {

    private static final long serialVersionUID = 1024967343L;

    public static final QDept dept = new QDept("dept");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final StringPath deptCode = createString("deptCode");

    public final StringPath deptName = createString("deptName");

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final BooleanPath isActive = createBoolean("isActive");

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QDept(String variable) {
        super(Dept.class, forVariable(variable));
    }

    public QDept(Path<? extends Dept> path) {
        super(path.getType(), path.getMetadata());
    }

    public QDept(PathMetadata metadata) {
        super(Dept.class, metadata);
    }

}

