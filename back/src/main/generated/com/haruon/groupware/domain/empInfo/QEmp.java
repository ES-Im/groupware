package com.haruon.groupware.domain.empInfo;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QEmp is a Querydsl query type for Emp
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QEmp extends EntityPathBase<Emp> {

    private static final long serialVersionUID = -2045145314L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QEmp emp = new QEmp("emp");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final com.haruon.groupware.domain.shared.QEmail email;

    public final ListPath<EmpBelongings, QEmpBelongings> empBelongings = this.<EmpBelongings, QEmpBelongings>createList("empBelongings", EmpBelongings.class, QEmpBelongings.class, PathInits.DIRECT2);

    public final ListPath<EmpFile, QEmpFile> empFiles = this.<EmpFile, QEmpFile>createList("empFiles", EmpFile.class, QEmpFile.class, PathInits.DIRECT2);

    public final StringPath empName = createString("empName");

    public final StringPath empNo = createString("empNo");

    public final StringPath empPassword = createString("empPassword");

    public final StringPath extensionNo = createString("extensionNo");

    public final DatePath<java.time.LocalDate> hiredAt = createDate("hiredAt", java.time.LocalDate.class);

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final StringPath loginId = createString("loginId");

    public final DatePath<java.time.LocalDate> resignedAt = createDate("resignedAt", java.time.LocalDate.class);

    public final EnumPath<com.haruon.groupware.domain.empInfo.enums.EmpStatus> status = createEnum("status", com.haruon.groupware.domain.empInfo.enums.EmpStatus.class);

    public final SetPath<com.haruon.groupware.domain.empInfo.enums.SystemRoleCode, EnumPath<com.haruon.groupware.domain.empInfo.enums.SystemRoleCode>> systemRoles = this.<com.haruon.groupware.domain.empInfo.enums.SystemRoleCode, EnumPath<com.haruon.groupware.domain.empInfo.enums.SystemRoleCode>>createSet("systemRoles", com.haruon.groupware.domain.empInfo.enums.SystemRoleCode.class, EnumPath.class, PathInits.DIRECT2);

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QEmp(String variable) {
        this(Emp.class, forVariable(variable), INITS);
    }

    public QEmp(Path<? extends Emp> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QEmp(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QEmp(PathMetadata metadata, PathInits inits) {
        this(Emp.class, metadata, inits);
    }

    public QEmp(Class<? extends Emp> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.email = inits.isInitialized("email") ? new com.haruon.groupware.domain.shared.QEmail(forProperty("email")) : null;
    }

}

