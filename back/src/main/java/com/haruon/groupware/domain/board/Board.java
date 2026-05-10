package com.haruon.groupware.domain.board;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static io.jsonwebtoken.lang.Assert.state;
import static java.util.Objects.requireNonNull;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(callSuper = true, exclude = {"emp", "category", "boardFiles"})
public class Board extends AbstractEntity {

    private Emp emp;

    private Category category;

    private String title;

    private String content;

    private boolean isDraft;

    @Nullable private LocalDateTime publishedAt;

    @Nullable private LocalDateTime modifiedAt;

    private List<BoardFile> boardFiles = new ArrayList<>();

    private long viewCount;

    private long likeCount;

    private long commentCount;

    public static Board create(
            Emp author,
            Category category,
            String title,
            String content,
            Boolean isDraft,
            @Nullable LocalDateTime publishedAt
    ) {
        Board board = new Board();

        validateCategory(category);

        board.emp = requireNonNull(author);
        board.category = requireNonNull(category);
        board.title = requireNonNull(title);
        board.content = requireNonNull(content);
        board.isDraft = requireNonNull(isDraft);

        if(!isDraft) board.publishedAt = requireNonNull(publishedAt);

        board.viewCount = 0;
        board.likeCount = 0;
        board.commentCount = 0;

        return board;
    }


    public void changeBoard (
            Emp author,
            @Nullable Category category,
            @Nullable String editedTitle,
            @Nullable String editedContent,
            @Nullable LocalDateTime modifiedAt
    ) {
        validateAuthor(author);
        state(editedTitle != null || editedContent != null || category != null,
                "수정할 내용이 없음");
        if(category != null) validateCategory(category);

        this.title = editedTitle != null ? editedTitle : this.title;
        this.content = editedContent != null ? editedContent : this.content;
        this.category = category != null ? category : this.category;

        if(!this.isDraft) {
            requireNonNull(modifiedAt);
            state(modifiedAt.isAfter(this.publishedAt), "수정시각이 발행시각보다 이를 수 없음");

            this.modifiedAt = modifiedAt;
        }
    }

    public void publish(
            Emp author,
            LocalDateTime publishedAt
    ) {
        validateAuthor(author);
        state(this.isDraft, "임시저장 상태에서만 게시글 발행 가능");

        this.isDraft = false;
        this.publishedAt = requireNonNull(publishedAt);
    }

    //todo - 여기서 증감 부분은 application 쪽에서 구현해야함. redis로 할 부분과 나눌 것
    public void increaseViewCount(int viewCount) {
        validatePublished();
        validateCount(viewCount);

        this.viewCount += viewCount;
    }

    public void increaseLikeCount(int likeCount) {
        validatePublished();
        validateCount(likeCount);

        this.likeCount += likeCount;
    }

    public void decreaseLikeCount(int likeCount) {
        validatePublished();
        validateCount(likeCount);

        this.likeCount -= likeCount;
    }

    public void increaseCommentCount(int commentCount) {
        validatePublished();
        validateCount(commentCount);

        this.commentCount += commentCount;
    }

    public void decreaseCommentCount(int commentCount) {
        validatePublished();
        validateCount(commentCount);

        this.commentCount -= commentCount;
    }

    public void addBoardFile(
            Emp author,
            String mimeType,
            String originalName,
            String extension,
            Long fileSize,
            @Nullable LocalDateTime modifiedAt
    ) {
        validateAuthor(author);
        requireNonNull(mimeType);
        requireNonNull(originalName);
        requireNonNull(extension);
        requireNonNull(fileSize);

        if(!this.isDraft) {
            requireNonNull(modifiedAt);
            state(modifiedAt.isAfter(this.publishedAt), "수정시각이 발행시각보다 이를 수 없음");

            this.modifiedAt = modifiedAt;
        }

        BoardFile boardFile = BoardFile.create(
                this, mimeType, originalName, extension, fileSize
        );

        this.boardFiles.add(boardFile);
    }

    public void removeBoardFile(
            Emp author,
            long fileId,
            @Nullable LocalDateTime modifiedAt
    ) {
        validateAuthor(author);

        if(!this.isDraft) {
            requireNonNull(modifiedAt);
            state(modifiedAt.isAfter(this.publishedAt), "수정시각이 발행시각보다 이를 수 없음");

            this.modifiedAt = modifiedAt;
        }

        BoardFile boardFile = findBoardFile(fileId);

        this.boardFiles.remove(boardFile);

    }

    private static void validateCategory(Category category) {
        state(category.isVisible(), "활성화된 카테고리만 이용가능");
    }

    private BoardFile findBoardFile(long fileId) {
        return this.boardFiles.stream()
                .filter(f -> f.getId().equals(fileId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("대상 파일을 찾을 수 없습니다."));
    }

    private void validateAuthor(Emp author) {
        requireNonNull(author);
        state(this.emp.equals(author), "작성자만 수정/발행가능");
    }

    private void validatePublished() {
        state(!this.isDraft, "발행되지 않은 게시글");
    }

    private void validateCount(int count) {
        state(count > 0, "해당값은 음수가 될 수 없음");
    }


}
