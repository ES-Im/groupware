package com.haruon.groupware.application.board.provided.forCommand;

import com.haruon.groupware.application.board.service.command.dto.BoardCreateRequest;
import com.haruon.groupware.application.board.service.command.dto.BoardUpdateRequest;

import java.time.LocalDateTime;

public interface BoardManagement {

    long registerBoard(Long authorId, BoardCreateRequest request);

    void publishBoard(Long authorId, Long boardId, LocalDateTime publishedAt);

    void changeBoard(Long authorId, Long boardId, BoardUpdateRequest request);

    void deleteBoard(Long empId, Long boardId);
}
