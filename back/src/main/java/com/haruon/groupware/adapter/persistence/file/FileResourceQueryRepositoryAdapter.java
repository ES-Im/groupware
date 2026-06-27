package com.haruon.groupware.adapter.persistence.file;

import com.haruon.groupware.application.file.required.FileResourceQueryRepository;
import com.haruon.groupware.application.file.service.query.dto.FileResourceInfo;
import com.haruon.groupware.domain.QAbstractFileEntity;
import com.haruon.groupware.domain.board.QBoardFile;
import com.haruon.groupware.domain.draft.QDraftFile;
import com.haruon.groupware.domain.employee.QEmpFile;
import com.haruon.groupware.domain.franchise.QEducationFile;
import com.haruon.groupware.domain.meeting.QMeetingRoomFile;
import com.haruon.groupware.domain.message.QMessageFile;
import com.querydsl.core.types.Expression;
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

    private Expression<FileResourceInfo> fileResourceInfoExpression(QAbstractFileEntity fileEntity) {
        return Projections.constructor(
                FileResourceInfo.class,
                fileEntity.id,
                fileEntity.originalName,
                fileEntity.storedPath,
                fileEntity.storedName,
                fileEntity.mimeType,
                fileEntity.extension,
                fileEntity.fileSize
        );
    }


    @Override
    public Optional<FileResourceInfo> findEmpFileInfoByEmpIdAndFileIdForResource(Long empId, Long fileId) {
        return Optional.ofNullable(
                query.select(fileResourceInfoExpression(qEmpFile._super))
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
        return Optional.ofNullable(
                query.select(fileResourceInfoExpression(qDraftFile._super))
                        .from(qDraftFile)
                        .where(
                                qDraftFile.draft.id.eq(draftId),
                                qDraftFile.id.eq(fileId)
                        )
                        .fetchOne()
        );
    }

    @Override
    public Optional<FileResourceInfo> findMessageFileInfoByMessageIdAndFileIdForResource(Long messageId, Long fileId) {
        return Optional.ofNullable(
                query.select(fileResourceInfoExpression(qMessageFile._super))
                        .from(qMessageFile)
                        .where(
                                qMessageFile.message.id.eq(messageId),
                                qMessageFile.id.eq(fileId)
                        )
                        .fetchOne()
        );
    }

    @Override
    public Optional<FileResourceInfo> findBoardFileInfoByBoardIdAndFileIdForResource(Long boardId, Long fileId) {
        return Optional.ofNullable(
                query.select(fileResourceInfoExpression(qBoardFile._super))
                        .from(qBoardFile)
                        .where(
                                qBoardFile.board.id.eq(boardId),
                                qBoardFile.id.eq(fileId)
                        )
                        .fetchOne()
        );
    }

    @Override
    public Optional<FileResourceInfo> findEducationFileInfoByEducationIdAndFileIdForResource(Long educationId, Long fileId) {
        return Optional.ofNullable(
                query.select(fileResourceInfoExpression(qEducationFile._super))
                        .from(qEducationFile)
                        .where(
                                qEducationFile.education.id.eq(educationId),
                                qEducationFile.id.eq(fileId)
                        )
                        .fetchOne()
        );
    }

    @Override
    public Optional<FileResourceInfo> findMeetingRoomFileInfoByMeetingRoomIdAndFileIdForResource(Long meetingRoomId, Long fileId) {
        return Optional.ofNullable(
                query.select(fileResourceInfoExpression(qMeetingRoomFile._super))
                        .from(qMeetingRoomFile)
                        .where(
                                qMeetingRoomFile.meetingRoom.id.eq(meetingRoomId),
                                qMeetingRoomFile.id.eq(fileId)
                        )
                        .fetchOne()
        );
    }
}
