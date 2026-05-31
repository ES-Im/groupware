package com.haruon.groupware.application.file.required;

import com.haruon.groupware.application.file.dto.result.FilePathInfo;

import java.util.Optional;

public interface FileStoredInfoQueryRepository {

    Optional<FilePathInfo> findEmpFilePathInfoByStoredPath(Long empId, Long fileId);

    Optional<FilePathInfo> findDraftFilePathInfoByStoredPath(Long draftId, Long fileId);

    Optional<FilePathInfo> findBoardFilePathInfoByStoredPath(Long boardId, Long fileId);

    Optional<FilePathInfo> findMessageFilePathInfoByStoredPath(Long messageId, Long fileId);

    Optional<FilePathInfo> findEducationFilePathInfoByStoredPath(Long educationId, Long fileId);

    Optional<FilePathInfo> findMeetingRoomFilePathInfoByStoredPath(Long meetingId, Long fileId);

}
