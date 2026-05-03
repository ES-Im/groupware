package com.haruon.groupware.domain.draft;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QDraft is a Querydsl query type for Draft
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QDraft extends EntityPathBase<Draft> {

    private static final long serialVersionUID = -1497692734L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QDraft draft = new QDraft("draft");

    public final QApproval approval;

    public final ListPath<Circulation, QCirculation> circulations = this.<Circulation, QCirculation>createList("circulations", Circulation.class, QCirculation.class, PathInits.DIRECT2);

    public final StringPath content = createString("content");

    public final ListPath<DraftFile, QDraftFile> draftFiles = this.<DraftFile, QDraftFile>createList("draftFiles", DraftFile.class, QDraftFile.class, PathInits.DIRECT2);

    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    public final StringPath sourceKey = createString("sourceKey");

    public final DateTimePath<java.time.LocalDateTime> submittedAt = createDateTime("submittedAt", java.time.LocalDateTime.class);

    public final StringPath title = createString("title");

    public QDraft(String variable) {
        this(Draft.class, forVariable(variable), INITS);
    }

    public QDraft(Path<? extends Draft> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QDraft(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QDraft(PathMetadata metadata, PathInits inits) {
        this(Draft.class, metadata, inits);
    }

    public QDraft(Class<? extends Draft> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.approval = inits.isInitialized("approval") ? new QApproval(forProperty("approval"), inits.get("approval")) : null;
        this.emp = inits.isInitialized("emp") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("emp"), inits.get("emp")) : null;
    }

}

