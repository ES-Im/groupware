package com.haruon.groupware.adapter.persistence.file;

import com.haruon.groupware.application.file.dto.result.FilePathInfo;
import com.haruon.groupware.application.file.required.FileStoredInfoQueryRepository;
import com.haruon.groupware.domain.QAbstractFileEntity;
import com.haruon.groupware.domain.board.QBoardFile;
import com.haruon.groupware.domain.draft.QDraftFile;
import com.haruon.groupware.domain.empInfo.QEmpFile;
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
public class FileStoredInfoQueryRepositoryAdapter implements FileStoredInfoQueryRepository {

    private final JPAQueryFactory query;
    private final QEmpFile qEmpFile;
    private final QBoardFile qBoardFile;
    private final QMessageFile qMessageFile;
    private final QDraftFile qDraftFile;
    private final QMeetingRoomFile qMeetingRoomFile;
    private final QEducationFile qEducationFile;

    public FileStoredInfoQueryRepositoryAdapter(JPAQueryFactory queryFactory) {
        this.query = queryFactory;
        this.qEmpFile = QEmpFile.empFile;
        this.qBoardFile = QBoardFile.boardFile;
        this.qMessageFile = QMessageFile.messageFile;
        this.qDraftFile = QDraftFile.draftFile;
        this.qMeetingRoomFile = QMeetingRoomFile.meetingRoomFile;
        this.qEducationFile = QEducationFile.educationFile;
    }

    private Expression<FilePathInfo> filePathInfoExpression(QAbstractFileEntity fileEntity) {
        return Projections.constructor(
                FilePathInfo.class,
                fileEntity.storedPath,
                fileEntity.storedName
        );
    }

    @Override
    public Optional<FilePathInfo> findEmpFilePathInfoByStoredPath(Long empId, Long fileId) {
        return Optional.ofNullable(
                query.select(filePathInfoExpression(qEmpFile._super))
                        .from(qEmpFile)
                        .where(
                                qEmpFile.emp.id.eq(empId),
                                qEmpFile.id.eq(fileId)
                        )
                        .fetchOne()
        );
    }

    @Override
    public Optional<FilePathInfo> findDraftFilePathInfoByStoredPath(Long draftId, Long fileId) {
        return Optional.ofNullable(
                query.select(filePathInfoExpression(qDraftFile._super))
                        .from(qDraftFile)
                        .where(
                                qDraftFile.draft.id.eq(draftId),
                                qDraftFile.id.eq(fileId)
                        )
                        .fetchOne()
        );
    }

    @Override
    public Optional<FilePathInfo> findBoardFilePathInfoByStoredPath(Long boardId, Long fileId) {
        return Optional.ofNullable(
                query.select(filePathInfoExpression(qBoardFile._super))
                        .from(qBoardFile)
                        .where(
                                qBoardFile.board.id.eq(boardId),
                                qBoardFile.id.eq(fileId)
                        )
                        .fetchOne()
        );
    }

    @Override
    public Optional<FilePathInfo> findMessageFilePathInfoByStoredPath(Long messageId, Long fileId) {
        return Optional.ofNullable(
                query.select(filePathInfoExpression(qMessageFile._super))
                        .from(qMessageFile)
                        .where(
                                qMessageFile.message.id.eq(messageId),
                                qMessageFile.id.eq(fileId)
                        )
                        .fetchOne()
        );
    }

    @Override
    public Optional<FilePathInfo> findEducationFilePathInfoByStoredPath(Long educationId, Long fileId) {
        return Optional.ofNullable(
                query.select(filePathInfoExpression(qEducationFile._super))
                        .from(qEducationFile)
                        .where(
                                qEducationFile.education.id.eq(educationId),
                                qEducationFile.id.eq(fileId)
                        )
                        .fetchOne()
        );
    }

    @Override
    public Optional<FilePathInfo> findMeetingRoomFilePathInfoByStoredPath(Long meetingId, Long fileId) {
        return Optional.ofNullable(
                query.select(filePathInfoExpression(qMeetingRoomFile._super))
                        .from(qMeetingRoomFile)
                        .where(
                                qMeetingRoomFile.meetingRoom.id.eq(meetingId),
                                qMeetingRoomFile.id.eq(fileId)
                        )
                        .fetchOne()
        );
    }
}
