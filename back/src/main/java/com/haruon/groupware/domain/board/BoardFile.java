package com.haruon.groupware.domain.board;

import com.haruon.groupware.domain.AbstractFileEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardFile extends AbstractFileEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "board_id", nullable = false)
    private Board board;

    static BoardFile create(
            Board board,
            String mimeType,
            String originalName,
            String extension,
            Long fileSize
    ) {
        BoardFile boardFile = new BoardFile();
        boardFile.board = requireNonNull(board);

        boardFile.initFileMetadata(mimeType, originalName, extension, fileSize);

        return boardFile;
    }
}