package com.haruon.groupware.domain.draft;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QLeaveDraft is a Querydsl query type for LeaveDraft
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QLeaveDraft extends EntityPathBase<LeaveDraft> {

    private static final long serialVersionUID = 2096936361L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QLeaveDraft leaveDraft = new QLeaveDraft("leaveDraft");

    public final QDraft _super;

    // inherited
    public final QApproval approval;

    //inherited
    public final ListPath<Circulation, QCirculation> circulations;

    //inherited
    public final StringPath content;

    //inherited
    public final ListPath<DraftFile, QDraftFile> draftFiles;

    // inherited
    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    public final DateTimePath<java.time.LocalDateTime> endAt = createDateTime("endAt", java.time.LocalDateTime.class);

    public final EnumPath<com.haruon.groupware.domain.draft.sub.LeaveType> leaveType = createEnum("leaveType", com.haruon.groupware.domain.draft.sub.LeaveType.class);

    public final NumberPath<Long> reservedHours = createNumber("reservedHours", Long.class);

    //inherited
    public final StringPath sourceKey;

    public final DateTimePath<java.time.LocalDateTime> startAt = createDateTime("startAt", java.time.LocalDateTime.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> submittedAt;

    //inherited
    public final StringPath title;

    public QLeaveDraft(String variable) {
        this(LeaveDraft.class, forVariable(variable), INITS);
    }

    public QLeaveDraft(Path<? extends LeaveDraft> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QLeaveDraft(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QLeaveDraft(PathMetadata metadata, PathInits inits) {
        this(LeaveDraft.class, metadata, inits);
    }

    public QLeaveDraft(Class<? extends LeaveDraft> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this._super = new QDraft(type, metadata, inits);
        this.approval = _super.approval;
        this.circulations = _super.circulations;
        this.content = _super.content;
        this.draftFiles = _super.draftFiles;
        this.emp = _super.emp;
        this.sourceKey = _super.sourceKey;
        this.submittedAt = _super.submittedAt;
        this.title = _super.title;
    }

}

