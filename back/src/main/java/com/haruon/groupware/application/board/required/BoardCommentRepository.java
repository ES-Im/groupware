package com.haruon.groupware.application.board.required;

import com.haruon.groupware.domain.board.BoardComment;
import org.springframework.data.repository.Repository;

public interface BoardCommentRepository extends Repository<BoardComment, Long> {
}
