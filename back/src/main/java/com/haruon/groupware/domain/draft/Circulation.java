package com.haruon.groupware.domain.draft;

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

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Circulation extends AbstractEntity {

    private Draft draft;

    private Emp viewer;

    @Nullable private LocalDateTime readAt;

    static Circulation create(Draft draft, Emp emp) {
        Circulation ref = new Circulation();

        ref.draft = requireNonNull(draft);
        ref.viewer = requireNonNull(emp);

        return ref;
    }

    void markRead(LocalDateTime readAt) {
        requireNonNull(readAt);
        state(this.readAt == null, "이미 공람 처리됨");
        this.readAt = requireNonNull(readAt);
    }


}
