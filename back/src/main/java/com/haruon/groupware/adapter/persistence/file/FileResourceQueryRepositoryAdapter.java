package com.haruon.groupware.adapter.persistence.file;

import com.haruon.groupware.application.file.dto.result.FileResourceInfo;
import com.haruon.groupware.application.file.required.FileResourceQueryRepository;
import com.haruon.groupware.domain.board.QBoardFile;
import com.haruon.groupware.domain.draft.QDraftFile;
import com.haruon.groupware.domain.empInfo.QEmpFile;
import com.haruon.groupware.domain.franchise.QEducationFile;
import com.haruon.groupware.domain.meeting.QMeetingRoomFile;
import com.haruon.groupware.domain.message.QMessageFile;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Slf4j
@Repository
public class FileResourceQueryRepositoryAdapter implements FileResourceQueryRepository {

    private final JPAQueryFactory query;
    private final QEmpFile qEmpFile;
    private final QBoardFile qBoardFile;
    private final QMessageFile qMessageFile;
    private final QDraftFile qDraftFile;
    private final QMeetingRoomFile qMeetingRoomFile;
    private final QEducationFile qEducationFile;

    public FileResourceQueryRepositoryAdapter(JPAQueryFactory queryFactory) {
        this.query = queryFactory;
        this.qEmpFile = QEmpFile.empFile;
        this.qBoardFile = QBoardFile.boardFile;
        this.qMessageFile = QMessageFile.messageFile;
        this.qDraftFile = QDraftFile.draftFile;
        this.qMeetingRoomFile = QMeetingRoomFile.meetingRoomFile;
        this.qEducationFile = QEducationFile.educationFile;
    }

    @Override
    public Optional<FileResourceInfo> findEmpFileInfoByEmpIdAndFileIdForResource(Long empId, Long fileId) {
        return Optional.ofNullable(
                query.select(Projections.constructor(
                                FileResourceInfo.class,
                                qEmpFile.id,
                                qEmpFile.originalName,
                                qEmpFile.storedPath,
                                qEmpFile.storedName,
                                qEmpFile.mimeType,
                                qEmpFile.extension,
                                qEmpFile.fileSize
                        ))
                        .from(qEmpFile)
                        .where(
                                qEmpFile.emp.id.eq(empId),
                                qEmpFile.id.eq(fileId)
                        )
                        .fetchOne()
        );
    }

    @Override
    public Optional<FileResourceInfo> findDraftFileInfoByDraftIdAndFileIdForResource(Long draftId, Long fileId) {
        return Optional.empty();
    }

    @Override
    public Optional<FileResourceInfo> findMessageFileInfoByMessageIdAndFileIdForResource(Long messageId, Long fileId) {
        return Optional.empty();
    }

    @Override
    public Optional<FileResourceInfo> findBoardFileInfoByBoardIdAndFileIdForResource(Long boardId, Long fileId) {
        return Optional.empty();
    }

    @Override
    public Optional<FileResourceInfo> findEducationFileInfoByEducationIdAndFileIdForResource(Long educationId, Long fileId) {
        return Optional.empty();
    }

    @Override
    public Optional<FileResourceInfo> findMeetingRoomFileInfoByMeetingRoomIdAndFileIdForResource(Long meetingRoomId, Long fileId) {
        return Optional.empty();
    }
}
