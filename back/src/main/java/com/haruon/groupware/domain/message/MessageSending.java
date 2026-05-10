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
public class MessageSending extends AbstractEntity {

    private Message message;

    private Emp emp;

    @Nullable private LocalDateTime deletedAt;

    @Nullable private LocalDateTime trashedAt;

    static MessageSending create(Message message, Emp emp) {
        MessageSending sending = new MessageSending();

        sending.message = requireNonNull(message);
        sending.emp = requireNonNull(emp);

        return sending;
    }

    void markDeleted(LocalDateTime deletedAt) {
        validateNotDeleted();

        this.deletedAt = requireNonNull(deletedAt);
    }

    void markTrashed(LocalDateTime trashedAt) {
        validateNotDeleted();

        this.trashedAt = requireNonNull(trashedAt);
    }

    void revertTrashed() {
        validateNotDeleted();

        this.trashedAt = null;
    }

    boolean isDeleted() {
        return this.deletedAt != null;
    }

    boolean isTrashed() {
        return this.trashedAt != null;
    }

    boolean isSender(Emp emp) {
        return this.emp.equals(emp);
    }

    private void validateNotDeleted() {
        state(!isDeleted(), "삭제된 쪽지는 변경을 할 수 없음");
    }


}