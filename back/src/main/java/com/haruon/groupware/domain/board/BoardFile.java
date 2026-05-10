package com.haruon.groupware.domain.board;

import com.haruon.groupware.domain.AbstractFileEntity;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoardFile extends AbstractFileEntity {

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