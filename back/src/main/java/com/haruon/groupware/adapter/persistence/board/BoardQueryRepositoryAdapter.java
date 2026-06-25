package com.haruon.groupware.adapter.persistence.board;

import com.haruon.groupware.application.board.required.BoardQueryRepository;
import com.haruon.groupware.application.board.service.dto.response.*;
import com.haruon.groupware.application.file.dto.response.FileListInfo;
import com.haruon.groupware.domain.board.QBoard;
import com.haruon.groupware.domain.board.QBoardComment;
import com.haruon.groupware.domain.board.QBoardFile;
import com.haruon.groupware.domain.empInfo.QEmp;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class BoardQueryRepositoryAdapter implements BoardQueryRepository {

    private final JPAQueryFactory query;
    private final QBoard board = QBoard.board;
    private final QBoardComment comment = QBoardComment.boardComment;
    private final QBoardFile boardFile = QBoardFile.boardFile;
    private final QEmp emp = QEmp.emp;

    @Override
    public Page<BoardSummaryResponse> findBoardsByCategoryId(
            Long categoryId,
            @Nullable String boardTitleKeyword,
            Pageable pageable
    ) {
        Long rows = query
                .select(board.id.countDistinct())
                .from(board)
                .where(
                        getCategoryEq(categoryId),
                        getKeywordInBoardTitle(boardTitleKeyword),
                        isPublished(true)
                ).fetchOne();

        long totalRows = rows == null ? 0 : rows;
        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<BoardSummaryResponse> responses = query
                .select(Projections.constructor(
                        BoardSummaryResponse.class,
                        board.id, board.title, emp.empName,
                        board.publishedAt, board.viewCount, board.likeCount,
                        board.commentCount, board.boardFiles.isNotEmpty()
                ))
                .from(board)
                .join(board.emp, emp)
                .where(
                        getCategoryEq(categoryId),
                        getKeywordInBoardTitle(boardTitleKeyword),
                        isPublished(true)
                )
                .orderBy(board.publishedAt.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }



    @Override
    public List<LatestBoardSummaryResponse> findLatestBoardsByCategoryId(
            Long categoryId,
            Long limit
    ) {
        return query
                .select(Projections.constructor(
                        LatestBoardSummaryResponse.class,
                        board.id,
                        board.title,
                        board.emp.empName,
                        board.publishedAt
                )).from(board)
                .join(board.emp, emp)
                .where(
                        getCategoryEq(categoryId),
                        isPublished(true)
                )
                .orderBy(board.publishedAt.desc())
                .limit(limit)
                .fetch();
    }

    @Override
    public BoardDetailResponse findBoardByIdAndIsDraftFalse(Long boardId) {
        return query
                .select(Projections.constructor(
                        BoardDetailResponse.class,
                        board.id,
                        board.category.id,
                        board.emp.id,
                        emp.empName,
                        board.title,
                        board.content,
                        board.publishedAt,
                        board.modifiedAt,
                        board.likeCount,
                        board.viewCount,
                        board.commentCount,
                        board.isDraft
                ))
                .from(board)
                .join(board.emp, emp)
                .where(
                        board.id.eq(boardId),
                        isPublished(true)
                )
                .fetchOne();
    }

    @Override
    public Page<BoardCommentResponse> findCommentsByBoardId(
            Long boardId, Pageable pageable
    ) {
        Long rows = query
                .select(comment.countDistinct())
                .from(comment)
                .where(
                        comment.board.id.eq(boardId)
                ).fetchOne();

        long totalRows = rows == null? 0 : rows;

        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<BoardCommentResponse> responses = query
                .select(Projections.constructor(
                        BoardCommentResponse.class,
                        comment.parentComment.id,
                        comment.id,
                        emp.id,
                        emp.empName,
                        comment.content,
                        comment.registerAt,
                        comment.editedAt.isNotNull(),
                        comment.isDeleted
                )).from(comment)
                .join(comment.emp, emp)
                .where(
                        comment.board.id.eq(boardId)
                )
                .orderBy(comment.createdAt.asc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    @Override
    public List<FileListInfo> findBoardFilesByBoardId(Long boardId) {
        return query
                .select(
                        Projections.constructor(
                                FileListInfo.class,
                                boardFile.id,
                                boardFile.originalName,
                                boardFile.extension,
                                boardFile.fileSize
                        )
                ).from(boardFile)
                .where(
                        boardFile.board.id.eq(boardId)
                )
                .fetch();
    }

    @Override
    public Boolean existsBoardByIdAndEmpId(Long boardId, Long authorEmpId) {
        Integer found = query
                .selectOne()
                .from(board)
                .where(
                        board.id.eq(boardId),
                        board.emp.id.eq(authorEmpId)
                ).fetchFirst();

        return found != null;
    }

    @Override
    public BoardDetailForEditResponse findBoardByIdAndEmpId(Long boardId, Long authorEmpId) {
        return query
                .select(Projections.constructor(
                        BoardDetailForEditResponse.class,
                        board.id, board.category.id, board.title, board.content
                )).from(board)
                .where(
                        board.id.eq(boardId),
                        board.emp.id.eq(authorEmpId)
                )
                .fetchOne();
    }

    @Override
    public List<BoardDraftsResponse> findBoardByAuthorIdAndIsDraftTrue(
            Long authorEmpId
    ) {
        return query
                .select(Projections.constructor(
                        BoardDraftsResponse.class,
                        board.id, board.title, board.updatedAt
                )).from(board)
                .where(
                        board.emp.id.eq(authorEmpId),
                        isPublished(false)
                )
                .fetch();
    }

    private BooleanExpression getCategoryEq(Long categoryId) {
        return board.category.id.eq(categoryId);
    }

    private BooleanExpression getKeywordInBoardTitle(@Nullable String keyword) {
        return keyword == null || keyword.isBlank()
                ? null
                : board.title.containsIgnoreCase(keyword);
    }

    private BooleanExpression isPublished(Boolean isPublished) {
        return board.isDraft.ne(isPublished);
    }
}
