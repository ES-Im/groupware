package com.haruon.groupware.application.board.service.command;

import com.haruon.groupware.application.board.provided.forCommand.BoardManagement;
import com.haruon.groupware.application.board.required.BoardRepository;
import com.haruon.groupware.application.board.required.CategoryRepository;
import com.haruon.groupware.application.board.service.command.dto.BoardCreateRequest;
import com.haruon.groupware.application.board.service.command.dto.BoardUpdateRequest;
import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.file.service.command.dto.FilePathInfo;
import com.haruon.groupware.domain.board.Board;
import com.haruon.groupware.domain.board.Category;
import com.haruon.groupware.domain.employee.Emp;
import com.haruon.groupware.domain.employee.enums.SystemRoleCode;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

import static com.haruon.groupware.application.board.service.support.BoardUtils.findBoard;
import static com.haruon.groupware.application.board.service.support.BoardUtils.findVisableCategory;
import static com.haruon.groupware.application.utils.AuthValidator.findActiveEmpById;

@Transactional
@Service
@RequiredArgsConstructor
public class BoardCommandService implements BoardManagement {

    private final BoardRepository boardRepository;
    private final EmpRepository empRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorage fileStorage;

    @Override
    public long registerBoard(Long authorId, BoardCreateRequest request) {
        Emp author = findActiveEmpById(empRepository, authorId);
        Category category = findVisableCategory(categoryRepository, request.categoryId());

        boolean isDraft = request.publishedAt() == null;

        Board board = Board.create(
                author, category,
                request.title(), request.content(), isDraft, request.publishedAt()
        );

        return boardRepository.save(board).getId();
    }

    @Override
    public void publishBoard(Long authorId, Long boardId, LocalDateTime publishedAt) {
        Emp author = findActiveEmpById(empRepository, authorId);
        Board board = findBoard(boardRepository, boardId);
        validateAuthor(author, board);

        board.publish(author, publishedAt);
    }

    @Override
    public void changeBoard(Long authorId, Long boardId, BoardUpdateRequest request) {
        Emp author = findActiveEmpById(empRepository, authorId);
        Board board = findBoard(boardRepository, boardId);
        validateAuthor(author, board);
        Category category = request.categoryId() != null
                ? findVisableCategory(categoryRepository, request.categoryId())
                : null;

        board.changeBoard(
                author, category, request.title(), request.content(), request.modifiedAt()
        );
    }

    @Override
    public void deleteBoard(Long empId, Long boardId) {
        Emp author = findActiveEmpById(empRepository, empId);
        Board board = findBoard(boardRepository, boardId);
        validateAuthor(author, board);

        List<FilePathInfo> files = board.getBoardFiles().stream()
                .map(file -> new FilePathInfo(file.getStoredPath(), file.getStoredName()))
                .toList();

        boardRepository.delete(board);

        files.forEach(file -> fileStorage.delete(file.storedPath(), file.storedName()));
    }

    private void validateAuthor(Emp author, Board board) {
        if(!author.equals(board.getEmp()) &&
                !author.getSystemRoles().contains(SystemRoleCode.ADMIN)
        ) throw new PermissionDeniedException();
    }
}
