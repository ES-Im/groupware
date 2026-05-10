package com.haruon.groupware.domain.message;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MessageReceiving extends AbstractEntity {

    private Message message;

    private Emp emp;

    @Nullable private LocalDateTime readAt;

    @Nullable private LocalDateTime deletedAt;

    @Nullable private LocalDateTime trashedAt;

    static MessageReceiving create(
        Message message, Emp emp
    ) {
        MessageReceiving receiving = new MessageReceiving();

        receiving.message = requireNonNull(message);
        receiving.emp = requireNonNull(emp);

        return receiving;
    }

    void markRead(LocalDateTime readAt) {
        validateNotDeleted();
        this.readAt = requireNonNull(readAt);
    }

    void markTrashed(LocalDateTime trashedAt) {
        validateNotDeleted();
        if(isTrashed()) return;

        this.trashedAt = requireNonNull(trashedAt);
    }

    void revertTrashed() {
        validateNotDeleted();
        if(!isTrashed()) return;

        this.trashedAt = null;
    }

    void delete(LocalDateTime deletedAt) {
        validateNotDeleted();

        this.deletedAt = requireNonNull(deletedAt);
    }

    boolean isDeleted() {
        return this.deletedAt != null;
    }

    boolean isTrashed() {
        return this.trashedAt != null;
    }

    boolean isRead() {
        return this.readAt != null;
    }

    boolean isReceiver(Emp emp) {
        return this.emp.equals(emp);
    }

    private void validateNotDeleted() {
        state(!isDeleted(), "삭제된 쪽지는 변경을 할 수 없음");
    }
}