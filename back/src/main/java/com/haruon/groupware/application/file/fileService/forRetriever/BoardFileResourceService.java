package com.haruon.groupware.application.file.fileService.forRetriever;

import com.haruon.groupware.application.exception.file.FileNotFoundException;
import com.haruon.groupware.application.file.dto.result.FileResourceInfo;
import com.haruon.groupware.application.file.fileService.FileDomain;
import com.haruon.groupware.application.file.required.FileResourceQueryRepository;
import com.haruon.groupware.application.file.required.FileStorage;
import org.springframework.stereotype.Service;

@Service
public class BoardFileResourceService extends AbstractFileResourceService {

    @Override
    public FileDomain domain() {
        return FileDomain.BOARD;
    }

    public BoardFileResourceService(
            FileResourceQueryRepository fileResourceQueryRepository,
            FileStorage fileStorage
    ) {
        super(fileResourceQueryRepository, fileStorage);
    }

    protected FileResourceInfo getFileResourceInfo(Long boardId, Long fileId) {
        return  fileResourceQueryRepository
                .findBoardFileInfoByBoardIdAndFileIdForResource(boardId, fileId)
                .orElseThrow(FileNotFoundException::new);
    }

}
