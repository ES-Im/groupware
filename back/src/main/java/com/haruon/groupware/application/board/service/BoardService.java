package com.haruon.groupware.application.board.service;

import com.haruon.groupware.application.board.provided.BoardManagement;
import com.haruon.groupware.application.board.required.BoardRepository;
import com.haruon.groupware.application.board.required.CategoryRepository;
import com.haruon.groupware.application.board.service.dto.BoardCreateRequest;
import com.haruon.groupware.application.board.service.dto.BoardFileRequest;
import com.haruon.groupware.application.board.service.dto.BoardUpdateRequest;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.utils.file.FileDto;
import com.haruon.groupware.application.utils.file.StoreFile;
import com.haruon.groupware.application.utils.file.required.FileStorage;
import com.haruon.groupware.domain.board.Board;
import com.haruon.groupware.domain.board.Category;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.board.service.BoardUtils.findBoard;
import static com.haruon.groupware.application.board.service.BoardUtils.findVisableCategory;
import static com.haruon.groupware.application.utils.AuthorizationChecker.findActiveEmpById;

@Transactional
@Service
@RequiredArgsConstructor
public class BoardService implements BoardManagement {

    private final BoardRepository boardRepository;
    private final EmpRepository empRepository;
    private final CategoryRepository categoryRepository;
    private final FileStorage fileStorage;

    private static final String BOARD_FILE_TYPE = "board";

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
        Category category = findVisableCategory(categoryRepository, request.categoryId());

        board.changeBoard(
                author, category, request.title(), request.content(), request.modifiedAt()
        );
    }

    @Override
    public void addFile(Long authorId, Long boardId, BoardFileRequest request) {
        Emp author = findActiveEmpById(empRepository, authorId);
        Board board = findBoard(boardRepository, boardId);
        validateAuthor(author, board);

        FileDto file = request.file();
        StoreFile storedFile = fileStorage.store(file, BOARD_FILE_TYPE);

        board.addBoardFile(
                author,
                storedFile.mimeType(),
                storedFile.originalName(),
                storedFile.storedName(),
                storedFile.extension(),
                storedFile.fileSize(),
                storedFile.storedPath(),
                request.modifiedAt()
        );
    }

    @Override
    public void removeFile(Long authorId, Long boardId, Long fileId, LocalDateTime modifiedAt) {
        Emp author = findActiveEmpById(empRepository, authorId);
        Board board = findBoard(boardRepository, boardId);
        validateAuthor(author, board);

        board.removeBoardFile(author, fileId, modifiedAt);
    }

    private void validateAuthor(Emp author, Board board) {
        if(!author.equals(board.getEmp()) &&
                !author.getSystemRoles().contains(SystemRoleCode.ADMIN)
        ) throw new PermissionDeniedException();
    }
}
