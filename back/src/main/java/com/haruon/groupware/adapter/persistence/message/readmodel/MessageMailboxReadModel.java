package com.haruon.groupware.adapter.persistence.message.readmodel;

import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.message.Message;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.Subselect;
import org.hibernate.annotations.Synchronize;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

/**
 * 발신·수신 목록을 통합 View 대체 조회전용 entity(SubSelect)
 */
@Entity
@Immutable
@Subselect("""
    SELECT
        CONCAT('SENDER:', ms.id) AS mailbox_key,
        ms.message_id,
        ms.sender_id AS owner_emp_id,
        'SENDER' AS box_type,
        CAST(NULL AS DATETIME) AS read_at,
        ms.trashed_at,
        ms.deleted_at
    FROM message_sending ms

    UNION ALL

    SELECT
        CONCAT('RECEIVER:', mr.id),
        mr.message_id,
        mr.receiver_id,
        'RECEIVER',
        mr.read_at,
        mr.trashed_at,
        mr.deleted_at
    FROM message_receiving mr
    """)
@Synchronize(
        value = {"message_sending", "message_receiving"},
        logical = false
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@SuppressWarnings("unused")
public class MessageMailboxReadModel {

    private String mailboxKey;

    private Message message;

    private Emp owner;

    private MessageBoxType boxType;

    @Nullable private LocalDateTime readAt;
    @Nullable private LocalDateTime trashedAt;
    @Nullable private LocalDateTime deletedAt;
}
