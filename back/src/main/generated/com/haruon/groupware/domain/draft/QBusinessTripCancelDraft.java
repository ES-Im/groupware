package com.haruon.groupware.domain.draft;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QBusinessTripCancelDraft is a Querydsl query type for BusinessTripCancelDraft
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QBusinessTripCancelDraft extends EntityPathBase<BusinessTripCancelDraft> {

    private static final long serialVersionUID = -390883357L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QBusinessTripCancelDraft businessTripCancelDraft = new QBusinessTripCancelDraft("businessTripCancelDraft");

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

    //inherited
    public final StringPath sourceKey;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> submittedAt;

    //inherited
    public final StringPath title;

    public QBusinessTripCancelDraft(String variable) {
        this(BusinessTripCancelDraft.class, forVariable(variable), INITS);
    }

    public QBusinessTripCancelDraft(Path<? extends BusinessTripCancelDraft> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QBusinessTripCancelDraft(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QBusinessTripCancelDraft(PathMetadata metadata, PathInits inits) {
        this(BusinessTripCancelDraft.class, metadata, inits);
    }

    public QBusinessTripCancelDraft(Class<? extends BusinessTripCancelDraft> type, PathMetadata metadata, PathInits inits) {
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

