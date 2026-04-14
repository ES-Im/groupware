package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Circulation extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "draft_id", nullable = false)
    private Draft draft;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emp_id", nullable = false)
    private Emp emp;

    private LocalDateTime readAt;

    static Circulation create(Draft draft, Emp emp) {
        Circulation ref = new Circulation();

        ref.draft = requireNonNull(draft);
        ref.emp = requireNonNull(emp);

        return ref;
    }

    void markRead(LocalDateTime readAt) {
        requireNonNull(readAt);
        state(this.readAt == null, "이미 공람 처리됨");
        this.readAt = requireNonNull(readAt);
    }


}
