package com.haruon.groupware.adapter.persistence.message;

import com.haruon.groupware.application.file.dto.response.FileListInfo;
import com.haruon.groupware.application.message.required.MessageQueryRepository;
import com.haruon.groupware.application.message.service.query.dto.MessageCountResponse;
import com.haruon.groupware.application.message.service.query.dto.MessageDetailResponse;
import com.haruon.groupware.application.message.service.query.dto.MessagesResponse;
import com.haruon.groupware.domain.empInfo.QDept;
import com.haruon.groupware.domain.empInfo.QEmp;
import com.haruon.groupware.domain.empInfo.QEmpBelongings;
import com.haruon.groupware.domain.message.QMessage;
import com.haruon.groupware.domain.message.QMessageReceiving;
import com.haruon.groupware.domain.message.QMessageSending;
import com.querydsl.core.types.ConstructorExpression;
import com.querydsl.core.types.NullExpression;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

import static com.querydsl.core.types.dsl.Expressions.TRUE;
import static com.querydsl.core.types.dsl.Expressions.nullExpression;

@Repository
@RequiredArgsConstructor
public class MessageQueryRepositoryAdapter implements MessageQueryRepository {

    private final JPAQueryFactory query;
    private final QMessage message = QMessage.message;
    private final QMessageSending sending = QMessageSending.messageSending;
    private final QMessageReceiving receiving = QMessageReceiving.messageReceiving;

    /**
     *      SELECT
     *          m.id AS message_id, m.title,
     *
     *          sender.id AS sender_id, sender_dept.dept_name AS sender_dept_name, sender.emp_name AS sender_name,
     *
     *          receiver.id AS receiver_id, receiver_dept.dept_name AS receiver_dept_name,
     *          receiver.emp_name AS receiver_name,
     *
     *          (SELECT COUNT(*)
     *              FROM message_receiving mr_count
     *              WHERE mr_count.message_id = m.id) AS receiver_count,
     *
     *          m.sent_at, (receiving.read_at IS NOT NULL) AS is_read, receiving.trashed_at,
     *          (sender.id = :receiverEmpId) AS is_sent_by_me,
     *          (SELECT COUNT(*)
     *              FROM message_file mf
     *              WHERE mf.message_id = m.id) AS file_count
     *      FROM message m
     *      JOIN message_sending sending
     *          ON sending.message_id = m.id
     *      JOIN emp sender
     *          ON sender.id = sending.emp_id
     *      LEFT JOIN emp_belongings sender_belongings
     *          ON sender_belongings.emp_id = sender.id
     *          AND sender_belongings.end_at IS NULL
     *          AND sender_belongings.is_primary = TRUE
     *      LEFT JOIN dept sender_dept
     *          ON sender_dept.id = sender_belongings.dept_id
     *
     *      JOIN message_receiving receiving
     *          ON receiving.message_id = m.id
     *      JOIN emp receiver
     *          ON receiver.id = receiving.emp_id
     *      LEFT JOIN emp_belongings receiver_belongings
     *          ON receiver_belongings.emp_id = receiver.id
     *          AND receiver_belongings.end_at IS NULL
     *          AND receiver_belongings.is_primary = TRUE
     *      LEFT JOIN dept receiver_dept
     *          ON receiver_dept.id = receiver_belongings.dept_id
     *
     *      WHERE receiver.id = :receiverEmpId
     *        AND m.sent_at IS NOT NULL
     *        AND receiving.deleted_at IS NULL
     *        AND receiving.trashed_at IS NULL
     *        AND (keywordContains(:keyword))
     *        AND (isRead())
     */
    @Override
    public Page<MessagesResponse> findReceivedMessageByEmpId(
            Long receiverEmpId,
            @Nullable String keyword,
            @Nullable Boolean isRead,
            Pageable pageable
    ) {
        QEmp sender = new QEmp("sender");
        QEmp receiver = new QEmp("receiver");
        QDept sDept = new QDept("senderDept");
        QDept rDept = new QDept("receiverDept");
        QEmpBelongings sBelongings = new QEmpBelongings("senderBelongings");
        QEmpBelongings rBelongings = new QEmpBelongings("receiverBelongings");

        Long rows = query
                .select(message.id.countDistinct())
                .from(message)
                .join(message.sending, sending)
                .join(sending.emp, sender)
                .leftJoin(sender.empBelongings, sBelongings)
                .on(sBelongings.endAt.isNull(), sBelongings.isPrimary.isTrue())
                .leftJoin(sBelongings.dept, sDept)

                .join(message.receivings, receiving)
                .join(receiving.emp, receiver)
                .leftJoin(receiver.empBelongings, rBelongings)
                .on(rBelongings.endAt.isNull(), rBelongings.isPrimary.isTrue())
                .leftJoin(rBelongings.dept, rDept)

                .where(
                        receiver.id.eq(receiverEmpId),
                        message.sentAt.isNotNull(),
                        receiving.deletedAt.isNull(),
                        receiving.trashedAt.isNull(),
                        isKeywordContainsForReceiver(keyword, sender),
                        isRead(isRead)
                )
                .fetchOne();

        long totalRows = rows == null ? 0 : rows;

        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<MessagesResponse> responses = query
                .select(getMessagesResponseConstructorExpression(
                        sender, sDept, receiver, rDept, isSentByMe(receiverEmpId)
                ))
                .from(message)
                .join(message.sending, sending)
                .join(sending.emp, sender)
                .leftJoin(sender.empBelongings, sBelongings)
                .on(sBelongings.endAt.isNull(), sBelongings.isPrimary.isTrue())
                .leftJoin(sBelongings.dept, sDept)

                .join(message.receivings, receiving)
                .join(receiving.emp, receiver)
                .leftJoin(receiver.empBelongings, rBelongings)
                .on(rBelongings.endAt.isNull(), rBelongings.isPrimary.isTrue())
                .leftJoin(rBelongings.dept, rDept)

                .where(
                        receiver.id.eq(receiverEmpId),
                        message.sentAt.isNotNull(),
                        receiving.deletedAt.isNull(),
                        receiving.trashedAt.isNull(),
                        isKeywordContainsForReceiver(keyword, sender),
                        isRead(isRead)
                )
                .orderBy(message.sentAt.desc(), message.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }


    @Override
    public Page<MessagesResponse> findSentMessageByEmpId(
            Long senderEmpId, @Nullable String keyword, Pageable pageable
    ) {
        QEmp sender = new QEmp("sender");
        QEmp receiver = new QEmp("receiver");
        QDept sDept = new QDept("senderDept");
        QDept rDept = new QDept("receiverDept");
        QEmpBelongings sBelongings = new QEmpBelongings("senderBelongings");
        QEmpBelongings rBelongings = new QEmpBelongings("receiverBelongings");
        QMessageReceiving representativeReceiving = new QMessageReceiving("representativeReceiving");

        Long rows = query
                .select(message.id.countDistinct())
                .from(message)
                .join(message.sending, sending)
                .join(sending.emp, sender)
                .leftJoin(sender.empBelongings, sBelongings)
                .on(sBelongings.endAt.isNull(), sBelongings.isPrimary.isTrue())
                .leftJoin(sBelongings.dept, sDept)

                .join(message.receivings, receiving)
                .join(receiving.emp, receiver)
                .leftJoin(receiver.empBelongings, rBelongings)
                .on(rBelongings.endAt.isNull(), rBelongings.isPrimary.isTrue())
                .leftJoin(rBelongings.dept, rDept)

                .where(
                        sender.id.eq(senderEmpId),
                        message.sentAt.isNotNull(),
                        sending.deletedAt.isNull(),
                        sending.trashedAt.isNull(),
                        isKeywordContainsForSender(keyword)
                )
                .fetchOne();

        long totalRows = rows == null ? 0 : rows;

        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<MessagesResponse> responses = query
                .select(getMessagesResponseConstructorExpression(
                        sender, sDept, receiver, rDept
                ))
                .from(message)
                .join(message.sending, sending)
                .join(sending.emp, sender)
                .leftJoin(sender.empBelongings, sBelongings)
                .on(sBelongings.endAt.isNull(), sBelongings.isPrimary.isTrue())
                .leftJoin(sBelongings.dept, sDept)

                .join(message.receivings, receiving)
                .on(receiving.id.eq(
                        JPAExpressions
                                .select(representativeReceiving.id.min())
                                .from(representativeReceiving)
                                .where(representativeReceiving.message.eq(message))
                ))
                .join(receiving.emp, receiver)
                .leftJoin(receiver.empBelongings, rBelongings)
                .on(rBelongings.endAt.isNull(), rBelongings.isPrimary.isTrue())
                .leftJoin(rBelongings.dept, rDept)

                .where(
                        sender.id.eq(senderEmpId),
                        message.sentAt.isNotNull(),
                        sending.deletedAt.isNull(),
                        sending.trashedAt.isNull(),
                        isKeywordContainsForSender(keyword)
                )
                .orderBy(message.sentAt.desc(), message.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }


    @Override
    public Page<MessagesResponse> findDraftMessageByEmpId(Long writerEmpId, @Nullable String keyword, Pageable pageable) {
        QEmp writer = new QEmp("sender");
        QDept sDept = new QDept("senderDept");
        QEmpBelongings sBelongings = new QEmpBelongings("senderBelongings");

        Long rows = query
                .select(message.id.countDistinct())
                .from(message)
                .join(message.sending, sending)
                .join(sending.emp, writer)
                .leftJoin(writer.empBelongings, sBelongings)
                .on(sBelongings.endAt.isNull(), sBelongings.isPrimary.isTrue())
                .leftJoin(sBelongings.dept, sDept)
                .where(
                        writer.id.eq(writerEmpId),
                        message.sentAt.isNull(),
                        isKeywordContainsForWriter(keyword)
                )
                .fetchOne();

        long totalRows = rows == null ? 0 : rows;

        if(totalRows == 0) return new PageImpl<>(List.of(), pageable, 0);

        List<MessagesResponse> responses = query
                .select(getMessagesResponseConstructorExpression(
                        writer, sDept
                ))
                .from(message)
                .join(message.sending, sending)
                .join(sending.emp, writer)
                .leftJoin(writer.empBelongings, sBelongings)
                .on(sBelongings.endAt.isNull(), sBelongings.isPrimary.isTrue())
                .leftJoin(sBelongings.dept, sDept)
                .where(
                        writer.id.eq(writerEmpId),
                        message.sentAt.isNull(),
                        isKeywordContainsForWriter(keyword)
                )
                .orderBy(message.id.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    /** union all 로 잇기 - 위 아래 별도 스코프이지만 내가 헷갈리니까 alias로
     * 1) emp - sender, receiver
     * 2) empBelonging = sBelongings, rBelogings
     * 3) dept - sDept, rDept
     * 4) message - sMessage, rMessage
     *
     * // 1. 내가 발신자
     *      SELECT *
     *        FROM message_sending ms
     *        -- 나
     *        JOIN ms.message, sMessage
     *             ON sMessage.sentAt.isNOTNULL()   // 임시저장 쪽지 삭제는 물리삭제임
     *        JOIN ms.emp, sender
     *
     *        LEFT JOIN sender.belongings, sBelongings
     *             ON sBelongings.end_at IS NULL AND sBelongings.is_primary = TRUE
     *        LEFT JOIN sBelongings.dept, sDept
     *
     *        -- 대표 수신자
     *        JOIN sMessage.receiving, receiving
     *             ON -- 여기서 대표적으로 조건을 걸어야함
     *
     *       WHERE ms.trashedAt.isNOTNULL() and ms.deletedAt.isNULL() and sender.id.eq(:empId) AND (keywordContains(:keyword)
     *
     *      UNION ALL
     * // 2. 내가 수신자
     *      SELECT *
     *        FROM message_receiving mr
     *        -- 나
     *        JOIN mr.message, rMessage
     *              ON rMessage.sentAt.isNotNull()
     *        JOIN rMessage.emp, receiver
     *        LEFT JOIN receiver.belogings, rBelongings
     *             ON rBelongings.end_at IS NULL AND rBelongings.is_primary = TRUE
     *        LEFT JOIN rBelongings.dept, rDept
     *        -발신인
     *        JOIN rMessage.sending, sending
     *       WHERE mr.trashedAt.isNotNull() and mr.deletedAt.isNull() and receiver.id.eq(:empId)AND (keywordContains(:keyword)
     *
     */
    @Override
    public Page<MessagesResponse> findMessageInTrashByEmpId(Long empId, @Nullable String keyword, Pageable pageable) {
        QEmp sender = new QEmp("sender");
        QDept sDept = new QDept("sender_dept");
        QEmpBelongings sBelongings = new QEmpBelongings("sender_belongings");
        QEmp receiver = new QEmp("receiver");
        QDept rDept = new QDept("receiver_dept");
        QEmpBelongings rBelongings = new QEmpBelongings("receiver_belongings");
        QMessageReceiving representativeReceiving = new QMessageReceiving("representative_Receiving");

        JPAQuery<?> viewerIsSender = getViewerIsSender(empId, keyword, sender, sBelongings, sDept, representativeReceiving, receiver, rBelongings, rDept);
        JPAQuery<?> viewerIsReceiver = getViewerIsReceiver(empId, keyword, receiver, rBelongings, rDept, sender, sBelongings, sDept);

        //todo - union 말고 view 방식으로 해결 @Immutable Entity를 persistence.view에 생성 -> 해당 메서드 쿼리말고 이미 위에 만들어둔것도 적용가능하겠금..

        return null;
    }

    private JPAQuery<?> getViewerIsSender(Long empId, @Nullable String keyword, QEmp sender, QEmpBelongings sBelongings, QDept sDept, QMessageReceiving representativeReceiving, QEmp receiver, QEmpBelongings rBelongings, QDept rDept) {
        return query
                .from(sending)
                .join(sending.message, message).on(message.sentAt.isNotNull())
                // 나 = 발신
                .join(sending.emp, sender)
                .leftJoin(sender.empBelongings, sBelongings).on(sBelongings.isPrimary.isTrue(), sBelongings.endAt.isNull())
                .leftJoin(sBelongings.dept, sDept)
                // 대표 수신자 정보
                .join(message.receivings, receiving)
                .on(receiving.id.eq(
                        JPAExpressions
                                .select(representativeReceiving.id.min())
                                .from(representativeReceiving)
                                .where(representativeReceiving.message.eq(message))
                ))
                .join(receiving.emp, receiver)
                .leftJoin(receiver.empBelongings, rBelongings).on(rBelongings.isPrimary.isTrue(), rBelongings.endAt.isNull())
                .leftJoin(rBelongings.dept, rDept)
                .where(
                        sending.trashedAt.isNotNull(),
                        sending.deletedAt.isNull(),

                        sender.id.eq(empId),
                        isKeywordContainsForSender(keyword)
                );
    }

    private JPAQuery<?> getViewerIsReceiver(Long empId, @Nullable String keyword, QEmp receiver, QEmpBelongings rBelongings, QDept rDept, QEmp sender, QEmpBelongings sBelongings, QDept sDept) {
        return query
                .from(receiving)
                .join(receiving.message, message).on(message.sentAt.isNotNull())
                // 나 = 수신
                .join(receiving.emp, receiver)
                .leftJoin(receiver.empBelongings, rBelongings).on(rBelongings.isPrimary.isTrue(), rBelongings.endAt.isNull())
                .leftJoin(rBelongings.dept, rDept)
                // 발신자 정보
                .join(message.sending, sending)
                .join(sending.emp, sender)
                .leftJoin(sender.empBelongings, sBelongings).on(sBelongings.isPrimary.isTrue(), sBelongings.endAt.isNull())
                .leftJoin(sBelongings.dept, sDept)

                .where(
                        receiving.trashedAt.isNotNull(),
                        receiving.deletedAt.isNull(),

                        receiver.id.eq(empId),
                        isKeywordContainsForReceiver(keyword, sender)
                );
    }


    private ConstructorExpression<MessagesResponse> getMessagesResponseConstructorExpression(
            QEmp sender, QDept senderDept, QEmp receiver, QDept receiverDept, BooleanExpression isSentByMe
    ) {
        return Projections.constructor(
                MessagesResponse.class,
                message.id, message.title,
                sender.id, senderDept.deptName, sender.empName,
                receiver.id, receiverDept.deptName, receiver.empName, message.receivings.size(),
                message.sentAt, receiving.readAt.isNotNull(), receiving.trashedAt,
                isSentByMe, message.messageFiles.size()
        );
    }

    private ConstructorExpression<MessagesResponse> getMessagesResponseConstructorExpression(
            QEmp sender, QDept senderDept, QEmp receiver, QDept receiverDept
    ) {
        return Projections.constructor(
                MessagesResponse.class,
                message.id, message.title,
                sender.id, senderDept.deptName, sender.empName,
                receiver.id, receiverDept.deptName, receiver.empName, message.receivings.size(),
                message.sentAt, nullExpressionByType(Boolean.class), sending.trashedAt,
                TRUE, message.messageFiles.size()
        );
    }

    private ConstructorExpression<MessagesResponse> getMessagesResponseConstructorExpression(
            QEmp sender, QDept senderDept
    ) {
        return Projections.constructor(
                MessagesResponse.class,
                message.id, message.title,
                sender.id, senderDept.deptName, sender.empName,
                nullExpressionByType(Long.class),
                nullExpressionByType(String.class),
                nullExpressionByType(String.class),
                Expressions.asNumber(0),

                message.sentAt, nullExpressionByType(Boolean.class), nullExpressionByType(LocalDateTime.class),
                TRUE, message.messageFiles.size()
        );
    }

    private BooleanExpression isKeywordContainsForReceiver(@Nullable String keyword, QEmp sender) {
        return keyword == null || keyword.isBlank()
                ? null
                : message.title.containsIgnoreCase(keyword)
                  .or(sender.empName.containsIgnoreCase(keyword));
    }

    private BooleanExpression isKeywordContainsForSender(@Nullable String keyword) {
        if(keyword == null || keyword.isBlank()) return null;

        QMessageReceiving keywordReceiving = new QMessageReceiving("keywordReceiving");
        QEmp keywordReceiver = new QEmp("keywordReceiver");

        return message.title.containsIgnoreCase(keyword)
                .or(JPAExpressions
                        .selectOne()
                        .from(keywordReceiving)
                        .join(keywordReceiving.emp, keywordReceiver)
                        .where(
                                keywordReceiving.message.eq(message),
                                keywordReceiver.empName.containsIgnoreCase(keyword)
                        )
                        .exists()
                );
    }

    private BooleanExpression isKeywordContainsForWriter(@Nullable String keyword) {
        return keyword == null || keyword.isBlank()
                ? null
                : message.title.containsIgnoreCase(keyword);
    }

    private BooleanExpression isSentByMe(Long empId) {
        return sending.emp.id.eq(empId);
    }

    private BooleanExpression isRead(@Nullable Boolean isRead) {
        return isRead == null
                ? null
                : isRead.equals(Boolean.TRUE)
                  ? receiving.readAt.isNotNull()
                  : receiving.readAt.isNull();
    }

    private <T> NullExpression<T> nullExpressionByType(Class<T> type) {
        return nullExpression(type);
    }

    @Override
    public MessageDetailResponse findMessageById(Long empId, Long messageId) {
        return null;
    }

    @Override
    public MessageCountResponse findMessageSummaryCountsByEmpId(Long empId) {
        return null;
    }

    @Override
    public List<FileListInfo> findMessageFilesById(Long empId, Long messageId) {
        return List.of();
    }
}
