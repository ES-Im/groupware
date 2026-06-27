package com.haruon.groupware.domain.sync;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.MappedSuperclass;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@ToString
@MappedSuperclass
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public abstract class SyncRequest extends AbstractEntity {

    private static final int PROCESSING_TIMEOUT_MINUTES = 10;

    private SyncStatus status;

    private SyncType type;

    private String externalId;

    private String endpointPath;

    private int retryCount;

    @Nullable
    private String lastErrorMessage;

    @Nullable
    private LocalDateTime startedAt;

    @Nullable
    private LocalDateTime finishedAt;

    protected SyncRequest(
            SyncType type,
            String externalId,
            String endpointPath
    ) {
        this.status = SyncStatus.PENDING;
        this.retryCount = 0;
        this.startedAt = null;
        this.finishedAt = null;

        this.type = requireNonNull(type);
        this.externalId = requireNonNull(externalId);
        this.endpointPath = requireNonNull(endpointPath);
    }

    public void start(LocalDateTime startedAt) {
        requireNonNull(startedAt);
        state(canStart(), "sync start 가능 상태(PENDING 또는 RETRY)이 아님");

        this.status = SyncStatus.PROCESSING;
        this.startedAt = startedAt;
        this.finishedAt = null;
    }

    public void complete(LocalDateTime completedAt) {
        requireNonNull(completedAt);
        state(isProcessing(), "sync complete 가능 상태(PROCESSING)이 아님");

        this.status = SyncStatus.DONE;
        this.finishedAt = completedAt;
    }

    public void fail(LocalDateTime failedAt, String errorMessage, int maxFailureCount) {
        requireNonNull(failedAt);
        requireNonNull(errorMessage);
        state(isProcessing(), "fail 가능한 상태(PROCESSING)가 아님");

        this.retryCount++;
        this.lastErrorMessage = errorMessage;
        this.finishedAt = failedAt;

        if (canRetry(maxFailureCount)) {
            this.status = SyncStatus.RETRY;
        } else {
            this.status = SyncStatus.FAILED;
        }
    }

    public void expireProcessing(LocalDateTime now, int maxFailureCount) {
        requireNonNull(now);
        state(isProcessing(), "PROCESSING 상태가 아님");
        state(this.startedAt != null, "PROCESSING 상태인데 startedAt이 없음");
        state(isExpiredProcessing(now), "PROCESSING 만료 상태가 아님");

        this.retryCount++;
        this.lastErrorMessage = "PROCESSING timeout";
        this.finishedAt = now;

        if (canRetry(maxFailureCount)) {
            this.status = SyncStatus.RETRY;
        } else {
            this.status = SyncStatus.FAILED;
        }
    }

    private boolean canStart() {
        return this.status == SyncStatus.PENDING
                || this.status == SyncStatus.RETRY;
    }

    private boolean isProcessing() {
        return this.status == SyncStatus.PROCESSING;
    }

    private boolean isExpiredProcessing(LocalDateTime now) {
        requireNonNull(this.startedAt);

        return !now.isBefore(this.startedAt.plusMinutes(PROCESSING_TIMEOUT_MINUTES));
    }

    private boolean canRetry(int maxFailureCount) {
        return this.retryCount < maxFailureCount;
    }

    public boolean isTerminal() {
        return this.status == SyncStatus.FAILED
                || this.status == SyncStatus.DONE;
    }
}