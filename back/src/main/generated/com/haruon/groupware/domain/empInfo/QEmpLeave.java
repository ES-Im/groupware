package com.haruon.groupware.domain.empInfo;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QEmpLeave is a Querydsl query type for EmpLeave
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QEmpLeave extends EntityPathBase<EmpLeave> {

    private static final long serialVersionUID = -1642622407L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QEmpLeave empLeave = new QEmpLeave("empLeave");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final NumberPath<Double> annualBaseGrantDays = createNumber("annualBaseGrantDays", Double.class);

    public final NumberPath<Double> annualUsedDays = createNumber("annualUsedDays", Double.class);

    public final NumberPath<Double> compensatoryGrantDays = createNumber("compensatoryGrantDays", Double.class);

    public final NumberPath<Double> compensatoryUsedDays = createNumber("compensatoryUsedDays", Double.class);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final QEmp emp;

    public final NumberPath<Integer> grantYear = createNumber("grantYear", Integer.class);

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final NumberPath<Double> specialGrantDays = createNumber("specialGrantDays", Double.class);

    public final NumberPath<Double> specialUsedDays = createNumber("specialUsedDays", Double.class);

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QEmpLeave(String variable) {
        this(EmpLeave.class, forVariable(variable), INITS);
    }

    public QEmpLeave(Path<? extends EmpLeave> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QEmpLeave(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QEmpLeave(PathMetadata metadata, PathInits inits) {
        this(EmpLeave.class, metadata, inits);
    }

    public QEmpLeave(Class<? extends EmpLeave> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.emp = inits.isInitialized("emp") ? new QEmp(forProperty("emp"), inits.get("emp")) : null;
    }

}

