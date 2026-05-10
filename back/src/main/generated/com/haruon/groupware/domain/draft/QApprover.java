package com.haruon.groupware.domain.draft;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QApprover is a Querydsl query type for Approver
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QApprover extends EntityPathBase<Approver> {

    private static final long serialVersionUID = 383015684L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QApprover approver1 = new QApprover("approver1");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final QApproval approval;

    public final DateTimePath<java.time.LocalDateTime> approvedAt = createDateTime("approvedAt", java.time.LocalDateTime.class);

    public final com.haruon.groupware.domain.empInfo.QEmp approver;

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final NumberPath<Integer> order = createNumber("order", Integer.class);

    public final BooleanPath pending = createBoolean("pending");

    public final DateTimePath<java.time.LocalDateTime> rejectedAt = createDateTime("rejectedAt", java.time.LocalDateTime.class);

    public final StringPath rejectReason = createString("rejectReason");

    public final EnumPath<com.haruon.groupware.domain.draft.sub.ApprovalRole> role = createEnum("role", com.haruon.groupware.domain.draft.sub.ApprovalRole.class);

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QApprover(String variable) {
        this(Approver.class, forVariable(variable), INITS);
    }

    public QApprover(Path<? extends Approver> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QApprover(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QApprover(PathMetadata metadata, PathInits inits) {
        this(Approver.class, metadata, inits);
    }

    public QApprover(Class<? extends Approver> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.approval = inits.isInitialized("approval") ? new QApproval(forProperty("approval"), inits.get("approval")) : null;
        this.approver = inits.isInitialized("approver") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("approver"), inits.get("approver")) : null;
    }

}

