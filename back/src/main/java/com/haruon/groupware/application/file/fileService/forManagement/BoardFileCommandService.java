package com.haruon.groupware.application.file.fileService.forManagement;

import com.haruon.groupware.application.board.required.BoardRepository;
import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.dto.request.BoardFileUploadRequest;
import com.haruon.groupware.application.file.dto.request.FileDto;
import com.haruon.groupware.application.file.dto.result.FilePathInfo;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.file.required.FileStoredInfoQueryRepository;
import com.haruon.groupware.domain.board.Board;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.board.service.BoardUtils.findBoard;
import static com.haruon.groupware.application.utils.AuthValidator.findActiveEmpById;
import static com.haruon.groupware.application.utils.Utils.ZONE_SEOUL;

@Service
public class BoardFileCommandService extends AbstractFileManagerService<BoardFileUploadRequest> {

    private final BoardRepository boardRepository;
    private final EmpRepository empRepository;

    public BoardFileCommandService(
           FileStoredInfoQueryRepository fileStoredInfoQueryRepository,
           FileStorage fileStorage,
           BoardRepository boardRepository,
           EmpRepository empRepository
    ) {
        super(fileStoredInfoQueryRepository, fileStorage);
        this.boardRepository = boardRepository;
        this.empRepository = empRepository;
    }

    @Override
    public FileDomain domain() {
        return FileDomain.BOARD;
    }

    @Override
    protected FilePathInfo getStoredInfo(FileDeleteRequest request) {
        return fileStoredInfoQueryRepository
                .findBoardFilePathInfoByStoredPath(request.domainPkId(), request.fileId())
                .orElseThrow(FileNotFoundException::new);
    }

    @Override
    protected void deleteFileMetaData(FileDeleteRequest request) {
        if(request.requesterEmpId() == null) throw new RequiredValueMissingException();

        Board board = findBoard(boardRepository, request.domainPkId());

        Emp author = validateRequester(request.requesterEmpId(), board);
        LocalDateTime editedTime = LocalDateTime.now(ZONE_SEOUL);

        board.removeBoardFile(author, request.fileId(), editedTime);
    }

    @Override
    protected void saveFileMetaData(BoardFileUploadRequest uploadRequest, FilePathInfo storedInfo) {
        Board board = findBoard(boardRepository, uploadRequest.boardId());
        Emp author = validateRequester(uploadRequest.requesterId(), board);

        FileDto file = uploadRequest.file();

        board.addBoardFile(
                author,
                file.mimeType(),
                file.originalFileName(),
                storedInfo.storedName(),
                file.extension(),
                file.fileSize(),
                storedInfo.storedPath(),
                uploadRequest.modifiedAt()
        );
    }

    private Emp validateRequester(Long empId, Board board) {
        Emp author = findActiveEmpById(empRepository, empId);

        if(!author.equals(board.getEmp()) &&
                !author.getSystemRoles().contains(SystemRoleCode.ADMIN)
        ) throw new PermissionDeniedException();

        return author;
    }




}
