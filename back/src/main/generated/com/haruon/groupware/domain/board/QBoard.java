package com.haruon.groupware.domain.board;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.dsl.StringTemplate;

import com.querydsl.core.types.PathMetadata;
import com.querydsl.core.annotations.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QBoard is a Querydsl query type for Board
 */
@SuppressWarnings("this-escape")
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QBoard extends EntityPathBase<Board> {

    private static final long serialVersionUID = 807544972L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QBoard board = new QBoard("board");

    public final com.haruon.groupware.domain.QAbstractEntity _super = new com.haruon.groupware.domain.QAbstractEntity(this);

    public final ListPath<BoardFile, QBoardFile> boardFiles = this.<BoardFile, QBoardFile>createList("boardFiles", BoardFile.class, QBoardFile.class, PathInits.DIRECT2);

    public final QCategory category;

    public final NumberPath<Long> commentCount = createNumber("commentCount", Long.class);

    public final StringPath content = createString("content");

    //inherited
    public final DateTimePath<java.time.Instant> createdAt = _super.createdAt;

    public final com.haruon.groupware.domain.empInfo.QEmp emp;

    //inherited
    public final NumberPath<Long> id = _super.id;

    public final BooleanPath isDraft = createBoolean("isDraft");

    public final NumberPath<Long> likeCount = createNumber("likeCount", Long.class);

    public final DateTimePath<java.time.LocalDateTime> modifiedAt = createDateTime("modifiedAt", java.time.LocalDateTime.class);

    public final DateTimePath<java.time.LocalDateTime> publishedAt = createDateTime("publishedAt", java.time.LocalDateTime.class);

    public final StringPath title = createString("title");

    //inherited
    public final DateTimePath<java.time.Instant> updatedAt = _super.updatedAt;

    public final NumberPath<Long> viewCount = createNumber("viewCount", Long.class);

    public QBoard(String variable) {
        this(Board.class, forVariable(variable), INITS);
    }

    public QBoard(Path<? extends Board> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QBoard(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QBoard(PathMetadata metadata, PathInits inits) {
        this(Board.class, metadata, inits);
    }

    public QBoard(Class<? extends Board> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.category = inits.isInitialized("category") ? new QCategory(forProperty("category")) : null;
        this.emp = inits.isInitialized("emp") ? new com.haruon.groupware.domain.empInfo.QEmp(forProperty("emp"), inits.get("emp")) : null;
    }

}

