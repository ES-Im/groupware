package com.haruon.groupware.domain.draft;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QBusinessTripDraft is a Querydsl query type for BusinessTripDraft
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QBusinessTripDraft extends EntityPathBase<BusinessTripDraft> {

    private static final long serialVersionUID = 520642365L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QBusinessTripDraft businessTripDraft = new QBusinessTripDraft("businessTripDraft");

    public final QDraft _super;

    // inherited
    public final QApproval approval;

    //inherited
    public final ListPath<Circulation, QCirculation> circulations;

    //inherited
    public final StringPath content;

    public final StringPath destination = createString("destination");

    //inherited
    public final BooleanPath draft;

    //inherited
    public final ListPath<DraftFile, QDraftFile> draftFiles;

    // inherited
    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    public final DateTimePath<java.time.LocalDateTime> endAt = createDateTime("endAt", java.time.LocalDateTime.class);

    public final ListPath<BusinessTripParticipant, QBusinessTripParticipant> participants = this.<BusinessTripParticipant, QBusinessTripParticipant>createList("participants", BusinessTripParticipant.class, QBusinessTripParticipant.class, PathInits.DIRECT2);

    public final StringPath purpose = createString("purpose");

    //inherited
    public final StringPath sourceKey;

    public final DateTimePath<java.time.LocalDateTime> startAt = createDateTime("startAt", java.time.LocalDateTime.class);

    //inherited
    public final DateTimePath<java.time.LocalDateTime> submittedAt;

    //inherited
    public final StringPath title;

    public QBusinessTripDraft(String variable) {
        this(BusinessTripDraft.class, forVariable(variable), INITS);
    }

    public QBusinessTripDraft(Path<? extends BusinessTripDraft> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QBusinessTripDraft(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QBusinessTripDraft(PathMetadata metadata, PathInits inits) {
        this(BusinessTripDraft.class, metadata, inits);
    }

    public QBusinessTripDraft(Class<? extends BusinessTripDraft> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this._super = new QDraft(type, metadata, inits);
        this.approval = _super.approval;
        this.circulations = _super.circulations;
        this.content = _super.content;
        this.draft = _super.draft;
        this.draftFiles = _super.draftFiles;
        this.emp = _super.emp;
        this.sourceKey = _super.sourceKey;
        this.submittedAt = _super.submittedAt;
        this.title = _super.title;
    }

}

