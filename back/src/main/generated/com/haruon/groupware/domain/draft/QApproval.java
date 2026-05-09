package com.haruon.groupware.domain.draft;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QApproval is a Querydsl query type for Approval
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QApproval extends EntityPathBase<Approval> {

    private static final long serialVersionUID = 383015554L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QApproval approval = new QApproval("approval");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final ListPath<Approver, QApprover> approvers = this.<Approver, QApprover>createList("approvers", Approver.class, QApprover.class, PathInits.DIRECT2);

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final QDraft draft;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final EnumPath<com.haruon.groupware.domain.draft.sub.ApprovalStatus> status = createEnum("status", com.haruon.groupware.domain.draft.sub.ApprovalStatus.class);

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public QApproval(String variable) {
        this(Approval.class, forVariable(variable), INITS);
    }

    public QApproval(Path<? extends Approval> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QApproval(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QApproval(PathMetadata metadata, PathInits inits) {
        this(Approval.class, metadata, inits);
    }

    public QApproval(Class<? extends Approval> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.draft = inits.isInitialized("draft") ? new QDraft(forProperty("draft"), inits.get("draft")) : null;
    }

}

