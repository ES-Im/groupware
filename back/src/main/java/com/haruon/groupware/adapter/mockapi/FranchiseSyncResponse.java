package com.haruon.groupware.adapter.mockapi;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.haruon.groupware.domain.sync.SyncType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.List;

/**
 * Mockoon API Server에서 받는 Json 형태
 * @param requestId - 외부 데이터 식별자  Id
 * @param source - 어느 서버에서 온건지 식별 예 - MOCKOON_FRANCHISE_API
 * @param syncType - 위 소스 중 어느 행위인지 식별 예 - DAILY_SALES
 * @param endpointPath - 외부 서버의 앤드포인트
 * @param generatedAt - 외부 응답 생성 시각
 * @param items - 외부 endpoint에서 받은 row 목록
 * @param <T> - sync type별 item DTO
 */
public record FranchiseSyncResponse<T>(

        @NotNull
        String requestId,

        @NotBlank
        String source,

        @NotNull
        SyncType syncType,

        @NotBlank
        String endpointPath,

        @NotNull
        @JsonFormat(without = JsonFormat.Feature.ADJUST_DATES_TO_CONTEXT_TIME_ZONE)
        OffsetDateTime generatedAt,

        @NotEmpty
        List<@Valid T> items    // package : application.syncRequest.service.dto.items 하위 DTO
) {
}
