package com.haruon.groupware.application.file.required;

import com.haruon.groupware.application.file.dto.result.FileResourceInfo;

import java.util.Optional;

/**
 * 파일 프리뷰, 다운로드 리소스 반환을 위함
 * application 내부 Resource 전달용 쿼리
 */
public interface FileResourceQueryRepository {

    /** 사원관련 파일 반환용 */
    Optional<FileResourceInfo> findEmpFileInfoByEmpIdAndFileIdForResource(Long empId, Long fileId);

    /** 기안서 파일 반환용 */
    Optional<FileResourceInfo> findDraftFileInfoByDraftIdAndFileIdForResource(Long draftId, Long fileId);

    /** 쪽지함 파일 반환용 */
    Optional<FileResourceInfo> findMessageFileInfoByMessageIdAndFileIdForResource(Long messageId, Long fileId);

    /** 게시판 파일 반환용 */
    Optional<FileResourceInfo> findBoardFileInfoByBoardIdAndFileIdForResource(Long boardId, Long fileId);

    /** 가맹점 교육 파일 반환용 */
    Optional<FileResourceInfo> findEducationFileInfoByEducationIdAndFileIdForResource(Long educationId, Long fileId);

    /** 회의실 파일 반환용 */
    Optional<FileResourceInfo> findMeetingRoomFileInfoByMeetingRoomIdAndFileIdForResource(Long meetingRoomId, Long fileId);

}
