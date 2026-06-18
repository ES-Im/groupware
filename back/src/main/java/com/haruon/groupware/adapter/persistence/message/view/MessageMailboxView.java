package com.haruon.groupware.adapter.persistence.message.view;

import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.message.Message;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

@Entity
@Immutable
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MessageMailboxView {

    private String mailboxKey;
    private Long sourceId;

    private Message message;

    private Emp owner;

    private MessageBoxType boxType;

    @Nullable private LocalDateTime readAt;
    @Nullable private LocalDateTime trashedAt;
    @Nullable private LocalDateTime deletedAt;
}
