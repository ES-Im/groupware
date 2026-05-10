package com.haruon.groupware.domain.draft;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QSalesDraft is a Querydsl query type for SalesDraft
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QSalesDraft extends EntityPathBase<SalesDraft> {

    private static final long serialVersionUID = -449582988L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QSalesDraft salesDraft = new QSalesDraft("salesDraft");

    public final QDraft _super;

    // inherited
    public final QApproval approval;

    //inherited
    public final ListPath<Circulation, QCirculation> circulations;

    //inherited
    public final StringPath content;

    //inherited
    public final BooleanPath draft;

    //inherited
    public final ListPath<DraftFile, QDraftFile> draftFiles;

    // inherited
    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    public final com.haruon.groupware.domain.franchise.QFranchise franchise;

    public final ComparablePath<java.time.YearMonth> reportMonth = createComparable("reportMonth", java.time.YearMonth.class);

    public final NumberPath<Long> salesAmount = createNumber("salesAmount", Long.class);

    //inherited
    public final StringPath sourceKey;

    //inherited
    public final DateTimePath<java.time.LocalDateTime> submittedAt;

    //inherited
    public final StringPath title;

    public QSalesDraft(String variable) {
        this(SalesDraft.class, forVariable(variable), INITS);
    }

    public QSalesDraft(Path<? extends SalesDraft> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QSalesDraft(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QSalesDraft(PathMetadata metadata, PathInits inits) {
        this(SalesDraft.class, metadata, inits);
    }

    public QSalesDraft(Class<? extends SalesDraft> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this._super = new QDraft(type, metadata, inits);
        this.approval = _super.approval;
        this.circulations = _super.circulations;
        this.content = _super.content;
        this.draft = _super.draft;
        this.draftFiles = _super.draftFiles;
        this.emp = _super.emp;
        this.franchise = inits.isInitialized("franchise") ? new com.haruon.groupware.domain.franchise.QFranchise(forProperty("franchise"), inits.get("franchise")) : null;
        this.sourceKey = _super.sourceKey;
        this.submittedAt = _super.submittedAt;
        this.title = _super.title;
    }

}

