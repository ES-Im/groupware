package com.haruon.groupware.application.board.provided;

import com.haruon.groupware.application.board.service.dto.BoardCreateRequest;
import com.haruon.groupware.application.board.service.dto.BoardFileRequest;
import com.haruon.groupware.application.board.service.dto.BoardUpdateRequest;

import java.time.LocalDateTime;

public interface BoardManagement {

    long registerBoard(Long authorId, BoardCreateRequest request);

    void publishBoard(Long authorId, Long boardId, LocalDateTime publishedAt);

    void changeBoard(Long authorId, Long boardId, BoardUpdateRequest request);

    void addFile(Long authorId, Long boardId, BoardFileRequest request);

    void removeFile(Long authorId, Long boardId, Long fileId, LocalDateTime modifiedAt);
}
