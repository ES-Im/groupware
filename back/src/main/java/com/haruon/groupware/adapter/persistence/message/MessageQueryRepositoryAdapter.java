package com.haruon.groupware.adapter.persistence.message;

import com.haruon.groupware.adapter.persistence.message.readmodel.QMessageMailboxReadModel;
import com.haruon.groupware.application.file.dto.response.FileListInfo;
import com.haruon.groupware.application.message.required.MessageQueryRepository;
import com.haruon.groupware.application.message.service.query.dto.MessageCountResponse;
import com.haruon.groupware.application.message.service.query.dto.MessageDetailResponse;
import com.haruon.groupware.application.message.service.query.dto.MessagesResponse;
import com.haruon.groupware.domain.empInfo.QDept;
import com.haruon.groupware.domain.empInfo.QEmp;
import com.haruon.groupware.domain.empInfo.QEmpBelongings;
import com.haruon.groupware.domain.message.QMessage;
import com.haruon.groupware.domain.message.QMessageFile;
import com.haruon.groupware.domain.message.QMessageReceiving;
import com.haruon.groupware.domain.message.QMessageSending;
import com.querydsl.core.types.ConstructorExpression;
import com.querydsl.core.types.Expression;
import com.querydsl.core.types.NullExpression;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import static com.haruon.groupware.adapter.persistence.message.readmodel.MessageBoxType.RECEIVER;
import static com.haruon.groupware.adapter.persistence.message.readmodel.MessageBoxType.SENDER;
import static com.querydsl.core.types.dsl.Expressions.TRUE;
import static com.querydsl.core.types.dsl.Expressions.nullExpression;

@Repository
@RequiredArgsConstructor
public class MessageQueryRepositoryAdapter implements MessageQueryRepository {

    private final JPAQueryFactory query;

    private final QMessageMailboxReadModel messageBox
            = QMessageMailboxReadModel.messageMailboxReadModel;
    private final QMessage message = QMessage.message;
    private final QMessageSending sending = QMessageSending.messageSending;
    private final QMessageReceiving receiving = QMessageReceiving.messageReceiving;

    @Override
    public Page<MessagesResponse> findReceivedMessageByEmpId(
            Long receiverEmpId,
            @Nullable String keyword,
            @Nullable Boolean isRead,
            Pageable pageable
    ) {
        QEmp sender = new QEmp("receivedSender");
        QEmp receiver = new QEmp("receivedReceiver");
        QDept senderDept = new QDept("receivedSenderDept");
        QDept receiverDept = new QDept("receivedReceiverDept");
        QEmpBelongings senderBelongings = new QEmpBelongings("receivedSenderBelongings");
        QEmpBelongings receiverBelongings = new QEmpBelongings("receivedReceiverBelongings");

        Long rows = query
                .select(messageBox.mailboxKey.count())
                .from(messageBox)
                .join(messageBox.message, message).on(message.sentAt.isNotNull())
                .join(messageBox.owner, receiver)
                .join(message.sending, sending)
                .join(sending.emp, sender)
                .where(
                        messageBox.boxType.eq(RECEIVER),
                        receiver.id.eq(receiverEmpId),
                        messageBox.deletedAt.isNull(),
                        messageBox.trashedAt.isNull(),
                        isKeywordContainsForReceiver(keyword, sender),
                        isRead(isRead)
                )
                .fetchOne();

        long totalRows = rows == null ? 0 : rows;
        if (totalRows == 0) return emptyPage(pageable);

        List<MessagesResponse> responses = query
                .select(receivedMessagesResponse(
                        sender, senderDept, receiver, receiverDept, receiverEmpId
                ))
                .from(messageBox)
                .join(messageBox.message, message).on(message.sentAt.isNotNull())
                .join(messageBox.owner, receiver)
                .leftJoin(receiver.empBelongings, receiverBelongings)
                .on(receiverBelongings.isPrimary.isTrue(), receiverBelongings.endAt.isNull())
                .leftJoin(receiverBelongings.dept, receiverDept)
                .join(message.sending, sending)
                .join(sending.emp, sender)
                .leftJoin(sender.empBelongings, senderBelongings)
                .on(senderBelongings.isPrimary.isTrue(), senderBelongings.endAt.isNull())
                .leftJoin(senderBelongings.dept, senderDept)
                .where(
                        messageBox.boxType.eq(RECEIVER),
                        receiver.id.eq(receiverEmpId),
                        messageBox.deletedAt.isNull(),
                        messageBox.trashedAt.isNull(),
                        isKeywordContainsForReceiver(keyword, sender),
                        isRead(isRead)
                )
                .orderBy(message.sentAt.desc(), message.id.desc(), messageBox.mailboxKey.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    @Override
    public Page<MessagesResponse> findSentMessageByEmpId(
            Long senderEmpId, @Nullable String keyword, Pageable pageable
    ) {
        QEmp sender = new QEmp("sentSender");
        QEmp receiver = new QEmp("sentRepresentativeReceiver");
        QDept senderDept = new QDept("sentSenderDept");
        QDept receiverDept = new QDept("sentReceiverDept");
        QEmpBelongings senderBelongings = new QEmpBelongings("sentSenderBelongings");
        QEmpBelongings receiverBelongings = new QEmpBelongings("sentReceiverBelongings");
        QMessageReceiving representativeReceiving = new QMessageReceiving("sentRepresentativeReceiving");
        QMessageReceiving representativeCandidate = new QMessageReceiving("sentRepresentativeCandidate");

        Long rows = query
                .select(messageBox.mailboxKey.count())
                .from(messageBox)
                .join(messageBox.message, message).on(message.sentAt.isNotNull())
                .join(messageBox.owner, sender)
                .where(
                        messageBox.boxType.eq(SENDER),
                        sender.id.eq(senderEmpId),
                        messageBox.deletedAt.isNull(),
                        messageBox.trashedAt.isNull(),
                        isKeywordContainsForSender(keyword)
                )
                .fetchOne();

        long totalRows = rows == null ? 0 : rows;
        if (totalRows == 0) return emptyPage(pageable);

        List<MessagesResponse> responses = query
                .select(sentMessagesResponse(sender, senderDept, receiver, receiverDept))
                .from(messageBox)
                .join(messageBox.message, message).on(message.sentAt.isNotNull())
                .join(messageBox.owner, sender)
                .leftJoin(sender.empBelongings, senderBelongings)
                .on(senderBelongings.isPrimary.isTrue(), senderBelongings.endAt.isNull())
                .leftJoin(senderBelongings.dept, senderDept)
                .join(message.receivings, representativeReceiving)
                .on(representativeReceiving.id.eq(
                        JPAExpressions
                                .select(representativeCandidate.id.min())
                                .from(representativeCandidate)
                                .where(representativeCandidate.message.eq(message))
                ))
                .join(representativeReceiving.emp, receiver)
                .leftJoin(receiver.empBelongings, receiverBelongings)
                .on(receiverBelongings.isPrimary.isTrue(), receiverBelongings.endAt.isNull())
                .leftJoin(receiverBelongings.dept, receiverDept)
                .where(
                        messageBox.boxType.eq(SENDER),
                        sender.id.eq(senderEmpId),
                        messageBox.deletedAt.isNull(),
                        messageBox.trashedAt.isNull(),
                        isKeywordContainsForSender(keyword)
                )
                .orderBy(message.sentAt.desc(), message.id.desc(), messageBox.mailboxKey.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    @Override
    public Page<MessagesResponse> findDraftMessageByEmpId(
            Long writerEmpId, @Nullable String keyword, Pageable pageable
    ) {
        QEmp writer = new QEmp("draftWriter");
        QDept writerDept = new QDept("draftWriterDept");
        QEmpBelongings writerBelongings = new QEmpBelongings("draftWriterBelongings");

        Long rows = query
                .select(messageBox.mailboxKey.count())
                .from(messageBox)
                .join(messageBox.message, message).on(message.sentAt.isNull())
                .join(messageBox.owner, writer)
                .where(
                        messageBox.boxType.eq(SENDER),
                        writer.id.eq(writerEmpId),
                        isKeywordContainsForWriter(keyword)
                )
                .fetchOne();

        long totalRows = rows == null ? 0 : rows;
        if (totalRows == 0) return emptyPage(pageable);

        List<MessagesResponse> responses = query
                .select(draftMessagesResponse(writer, writerDept))
                .from(messageBox)
                .join(messageBox.message, message).on(message.sentAt.isNull())
                .join(messageBox.owner, writer)
                .leftJoin(writer.empBelongings, writerBelongings)
                .on(writerBelongings.isPrimary.isTrue(), writerBelongings.endAt.isNull())
                .leftJoin(writerBelongings.dept, writerDept)
                .where(
                        messageBox.boxType.eq(SENDER),
                        writer.id.eq(writerEmpId),
                        isKeywordContainsForWriter(keyword)
                )
                .orderBy(message.id.desc(), messageBox.mailboxKey.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    @Override
    public Page<MessagesResponse> findMessageInTrashByEmpId(
            Long empId, @Nullable String keyword, Pageable pageable
    ) {
        QEmp owner = new QEmp("trashOwner");
        QEmp sender = new QEmp("trashSender");
        QEmp representativeReceiver = new QEmp("trashRepresentativeReceiver");

        QDept ownerDept = new QDept("trashOwnerDept");
        QDept senderDept = new QDept("trashSenderDept");
        QDept representativeReceiverDept = new QDept("trashRepresentativeReceiverDept");

        QEmpBelongings ownerBelongings = new QEmpBelongings("trashOwnerBelongings");
        QEmpBelongings senderBelongings = new QEmpBelongings("trashSenderBelongings");
        QEmpBelongings representativeReceiverBelongings =
                new QEmpBelongings("trashRepresentativeReceiverBelongings");

        QMessageReceiving representativeReceiving = new QMessageReceiving("trashRepresentativeReceiving");
        QMessageReceiving representativeCandidate = new QMessageReceiving("trashRepresentativeCandidate");

        Long rows = query
                .select(messageBox.mailboxKey.count())
                .from(messageBox)
                .join(messageBox.message, message).on(message.sentAt.isNotNull())
                .join(messageBox.owner, owner)
                .join(message.sending, sending)
                .join(sending.emp, sender)
                .where(
                        owner.id.eq(empId),
                        messageBox.trashedAt.isNotNull(),
                        messageBox.deletedAt.isNull(),
                        isKeywordContainsForTrash(keyword, sender)
                )
                .fetchOne();

        long totalRows = rows == null ? 0 : rows;
        if (totalRows == 0) return emptyPage(pageable);

        Expression<Long> receiverId = new CaseBuilder()
                .when(messageBox.boxType.eq(RECEIVER))
                .then(owner.id)
                .otherwise(representativeReceiver.id);
        Expression<String> receiverDeptName = new CaseBuilder()
                .when(messageBox.boxType.eq(RECEIVER))
                .then(ownerDept.deptName)
                .otherwise(representativeReceiverDept.deptName);
        Expression<String> receiverName = new CaseBuilder()
                .when(messageBox.boxType.eq(RECEIVER))
                .then(owner.empName)
                .otherwise(representativeReceiver.empName);
        Expression<Boolean> isRead = new CaseBuilder()
                .when(messageBox.boxType.eq(RECEIVER).and(messageBox.readAt.isNotNull()))
                .then(true)
                .when(messageBox.boxType.eq(RECEIVER))
                .then(false)
                .otherwise(nullExpression(Boolean.class));

        List<MessagesResponse> responses = query
                .select(messagesResponse(
                        sender,
                        senderDept,
                        receiverId,
                        receiverDeptName,
                        receiverName,
                        isRead,
                        messageBox.boxType.eq(SENDER)
                ))
                .from(messageBox)
                .join(messageBox.message, message).on(message.sentAt.isNotNull())
                .join(messageBox.owner, owner)
                .leftJoin(owner.empBelongings, ownerBelongings)
                .on(ownerBelongings.isPrimary.isTrue(), ownerBelongings.endAt.isNull())
                .leftJoin(ownerBelongings.dept, ownerDept)
                .join(message.sending, sending)
                .join(sending.emp, sender)
                .leftJoin(sender.empBelongings, senderBelongings)
                .on(senderBelongings.isPrimary.isTrue(), senderBelongings.endAt.isNull())
                .leftJoin(senderBelongings.dept, senderDept)
                .join(message.receivings, representativeReceiving)
                .on(representativeReceiving.id.eq(
                        JPAExpressions
                                .select(representativeCandidate.id.min())
                                .from(representativeCandidate)
                                .where(representativeCandidate.message.eq(message))
                ))
                .join(representativeReceiving.emp, representativeReceiver)
                .leftJoin(representativeReceiver.empBelongings, representativeReceiverBelongings)
                .on(
                        representativeReceiverBelongings.isPrimary.isTrue(),
                        representativeReceiverBelongings.endAt.isNull()
                )
                .leftJoin(representativeReceiverBelongings.dept, representativeReceiverDept)
                .where(
                        owner.id.eq(empId),
                        messageBox.trashedAt.isNotNull(),
                        messageBox.deletedAt.isNull(),
                        isKeywordContainsForTrash(keyword, sender)
                )
                .orderBy(messageBox.trashedAt.desc(), message.id.desc(), messageBox.mailboxKey.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        return new PageImpl<>(responses, pageable, totalRows);
    }

    private ConstructorExpression<MessagesResponse> receivedMessagesResponse(
            QEmp sender, QDept senderDept, QEmp receiver, QDept receiverDept, Long viewerEmpId
    ) {
        return messagesResponse(
                sender,
                senderDept,
                receiver.id,
                receiverDept.deptName,
                receiver.empName,
                messageBox.readAt.isNotNull(),
                sender.id.eq(viewerEmpId)
        );
    }

    private ConstructorExpression<MessagesResponse> sentMessagesResponse(
            QEmp sender, QDept senderDept, QEmp receiver, QDept receiverDept
    ) {
        return messagesResponse(
                sender,
                senderDept,
                receiver.id,
                receiverDept.deptName,
                receiver.empName,
                nullExpressionByType(Boolean.class),
                TRUE
        );
    }

    private ConstructorExpression<MessagesResponse> messagesResponse(
            QEmp sender,
            QDept senderDept,
            Expression<Long> receiverId,
            Expression<String> receiverDeptName,
            Expression<String> receiverName,
            Expression<Boolean> isRead,
            Expression<Boolean> isSentByMe
    ) {
        return Projections.constructor(
                MessagesResponse.class,
                message.id,
                message.title,
                sender.id,
                senderDept.deptName,
                sender.empName,
                receiverId,
                receiverDeptName,
                receiverName,
                message.receivings.size(),
                message.sentAt,
                isRead,
                messageBox.trashedAt,
                isSentByMe,
                message.messageFiles.size()
        );
    }

    private ConstructorExpression<MessagesResponse> draftMessagesResponse(QEmp writer, QDept writerDept) {
        return Projections.constructor(
                MessagesResponse.class,
                message.id,
                message.title,
                writer.id,
                writerDept.deptName,
                writer.empName,
                nullExpressionByType(Long.class),
                nullExpressionByType(String.class),
                nullExpressionByType(String.class),
                Expressions.asNumber(0),
                message.sentAt,
                nullExpressionByType(Boolean.class),
                messageBox.trashedAt,
                TRUE,
                message.messageFiles.size()
        );
    }

    private BooleanExpression isKeywordContainsForReceiver(@Nullable String keyword, QEmp sender) {
        return keyword == null || keyword.isBlank()
                ? null
                : message.title.containsIgnoreCase(keyword)
                  .or(sender.empName.containsIgnoreCase(keyword));
    }

    private BooleanExpression isKeywordContainsForSender(@Nullable String keyword) {
        if (keyword == null || keyword.isBlank()) return null;

        return message.title.containsIgnoreCase(keyword)
                .or(receiverNameContains(keyword));
    }

    private BooleanExpression isKeywordContainsForTrash(@Nullable String keyword, QEmp sender) {
        if (keyword == null || keyword.isBlank()) return null;

        return message.title.containsIgnoreCase(keyword)
                .or(messageBox.boxType.eq(RECEIVER)
                        .and(sender.empName.containsIgnoreCase(keyword)))
                .or(messageBox.boxType.eq(SENDER)
                        .and(receiverNameContains(keyword)));
    }

    private BooleanExpression receiverNameContains(String keyword) {
        QMessageReceiving keywordReceiving = new QMessageReceiving("mailboxKeywordReceiving");
        QEmp keywordReceiver = new QEmp("mailboxKeywordReceiver");

        return JPAExpressions
                .selectOne()
                .from(keywordReceiving)
                .join(keywordReceiving.emp, keywordReceiver)
                .where(
                        keywordReceiving.message.eq(message),
                        keywordReceiver.empName.containsIgnoreCase(keyword)
                )
                .exists();
    }

    private BooleanExpression isKeywordContainsForWriter(@Nullable String keyword) {
        return keyword == null || keyword.isBlank()
                ? null
                : message.title.containsIgnoreCase(keyword);
    }

    private BooleanExpression isRead(@Nullable Boolean isRead) {
        return isRead == null
                ? null
                : isRead
                  ? messageBox.readAt.isNotNull()
                  : messageBox.readAt.isNull();
    }

    private Page<MessagesResponse> emptyPage(Pageable pageable) {
        return new PageImpl<>(List.of(), pageable, 0);
    }

    private <T> NullExpression<T> nullExpressionByType(Class<T> type) {
        return nullExpression(type);
    }

    @Override
    public Optional<MessageDetailResponse> findMessageById(Long empId, Long messageId) {
        QEmp sender = new QEmp("sender");
        QDept senderDept = new QDept("senderDept");
        QEmpBelongings senderBelongings = new QEmpBelongings("senderBelongings");

        Expression<Boolean> isSentByMe = new CaseBuilder()
                .when(sender.id.eq(empId))
                .then(true)
                .otherwise(false);

        Expression<Boolean> isTrashedByMe = new CaseBuilder()
                .when(sender.id.eq(empId).and(sending.trashedAt.isNotNull()))
                .then(true)
                .when(receiving.emp.id.eq(empId).and(receiving.trashedAt.isNotNull()))
                .then(true)
                .otherwise(false);

        MessageDetailResponse.MessageInfo messageInfo = query
                .select(Projections.constructor(
                        MessageDetailResponse.MessageInfo.class,
                        message.id, message.title, message.content,
                        sender.id, senderDept.deptName, sender.empName,
                        message.sentAt, isTrashedByMe, isSentByMe,
                        message.messageFiles.size()
                ))
                .from(message)
                .join(message.sending, sending)
                .join(sending.emp, sender)
                .leftJoin(sender.empBelongings, senderBelongings).on(senderBelongings.isPrimary.isTrue(), senderBelongings.endAt.isNull())
                .leftJoin(senderBelongings.dept, senderDept)

                .leftJoin(message.receivings, receiving).on(receiving.emp.id.eq(empId))

                .where(
                        message.id.eq(messageId),
                        sending.emp.id.eq(empId).and(sending.deletedAt.isNull())
                                .or(receiving.id.isNotNull().and(receiving.deletedAt.isNull()))
                )
                .fetchOne();

        if(messageInfo == null) return Optional.empty();

        QEmp receiver = new QEmp("receiver");
        QDept receiverDept = new QDept("receiverDept");
        QEmpBelongings receiverBelongings = new QEmpBelongings("receiverBelongings");

        List<MessageDetailResponse.ReceiverInfo> receiverList = query
                .select(Projections.constructor(
                        MessageDetailResponse.ReceiverInfo.class,
                        receiver.id,
                        receiverDept.deptName,
                        receiver.empName,
                        receiving.readAt.isNotNull()
                ))
                .from(message)
                .join(message.receivings, receiving)
                .join(receiving.emp, receiver)
                .leftJoin(receiver.empBelongings, receiverBelongings).on(receiverBelongings.isPrimary.isTrue(), receiverBelongings.endAt.isNull())
                .leftJoin(receiverBelongings.dept, receiverDept)
                .where(message.id.eq(messageId))
                .orderBy(receiving.id.asc())
                .fetch();


        return Optional.of(new MessageDetailResponse(messageInfo, receiverList));
    }

    @Override
    public MessageCountResponse findMessageSummaryCountsByEmpId(Long empId) {
        NumberExpression<Long> receivedCount = new CaseBuilder()
                .when(
                        messageBox.boxType.eq(RECEIVER)
                                .and(messageBox.deletedAt.isNull())
                                .and(messageBox.trashedAt.isNull())
                                .and(message.sentAt.isNotNull())
                )
                .then(1)
                .otherwise(0)
                .sumLong()
                .coalesce(0L);

        NumberExpression<Long> unreadReceivedCount = new CaseBuilder()
                .when(
                        messageBox.boxType.eq(RECEIVER)
                                .and(messageBox.readAt.isNull())
                                .and(messageBox.deletedAt.isNull())
                                .and(messageBox.trashedAt.isNull())
                                .and(message.sentAt.isNotNull())
                )
                .then(1)
                .otherwise(0)
                .sumLong()
                .coalesce(0L);

        NumberExpression<Long> sentCount = new CaseBuilder()
                .when(
                        messageBox.boxType.eq(SENDER)
                                .and(messageBox.deletedAt.isNull())
                                .and(messageBox.trashedAt.isNull())
                                .and(message.sentAt.isNotNull())
                )
                .then(1)
                .otherwise(0)
                .sumLong()
                .coalesce(0L);

        NumberExpression<Long> draftCount = new CaseBuilder()
                .when(
                        messageBox.boxType.eq(SENDER)
                                .and(messageBox.deletedAt.isNull())
                                .and(messageBox.trashedAt.isNull())
                                .and(message.sentAt.isNull())
                )
                .then(1)
                .otherwise(0)
                .sumLong()
                .coalesce(0L);

        NumberExpression<Long> trashCount = new CaseBuilder()
                .when(
                        messageBox.deletedAt.isNull()
                                .and(messageBox.trashedAt.isNotNull())
                                .and(message.sentAt.isNotNull())
                )
                .then(1)
                .otherwise(0)
                .sumLong()
                .coalesce(0L);

        MessageCountResponse messageCountResponse = query
                .select(Projections.constructor(
                        MessageCountResponse.class,
                        receivedCount, unreadReceivedCount, sentCount, draftCount, trashCount
                ))
                .from(messageBox)
                .join(messageBox.message, message)
                .where(
                        messageBox.owner.id.eq(empId)
                ).fetchOne();

        return messageCountResponse == null
                ? new MessageCountResponse(0L,0L,0L,0L,0L)
                : messageCountResponse;
    }

    @Override
    public List<FileListInfo> findMessageFilesById(Long empId, Long messageId) {
        QMessageFile file = new QMessageFile("messageFile");

        return query
                .select(Projections.constructor(
                        FileListInfo.class,
                        file.id, file.originalName, file.extension, file.fileSize
                ))
                .from(file)
                .where(
                        file.message.id.eq(messageId),
                        JPAExpressions
                                .selectOne()
                                .from(messageBox)
                                .where(
                                        messageBox.owner.id.eq(empId),
                                        messageBox.message.id.eq(file.message.id),
                                        messageBox.deletedAt.isNull()
                                ).exists()

                )
                .orderBy(file.id.asc())
                .fetch();

    }
}
