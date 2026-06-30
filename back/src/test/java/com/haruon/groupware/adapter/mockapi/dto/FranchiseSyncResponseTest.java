package com.haruon.groupware.adapter.mockapi.dto;

import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.haruon.groupware.adapter.mockapi.FranchiseSyncResponse;
import com.haruon.groupware.application.syncRequest.service.dto.items.DailySalesSyncItem;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class FranchiseSyncResponseTest {

    private final ObjectMapper objectMapper = JsonMapper.builder()
            .addModule(new JavaTimeModule())
            .build();

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void deserializeDailySalesResponseWithItemIdx() throws Exception {
        FranchiseSyncResponse<DailySalesSyncItem> response = read("""
                {
                  "requestId": "mock-daily-sales-20260629-0001",
                  "source": "MOCKOON_FRANCHISE_API",
                  "syncType": "DAILY_SALES",
                  "endpointPath": "/api/daily-sales?externalId=SALES-1108167890-20250206&itemIdx=36",
                  "generatedAt": "2026-06-29T10:00:00+09:00",
                  "items": [
                    {
                      "itemIdx": 36,
                      "externalId": "SALES-1108167890-20250206",
                      "businessNumber": "1108167890",
                      "franchiseName": "하루온 강남점",
                      "salesDate": "2025-02-06",
                      "salesAmount": 1686445,
                      "orderCount": 101
                    }
                  ]
                }
                """, DailySalesSyncItem.class);

        assertThat(response.generatedAt().getOffset()).isEqualTo(ZoneOffset.ofHours(9));
        assertThat(response.items()).singleElement().satisfies(item -> {
            assertThat(item.itemIdx()).isEqualTo(36);
            assertThat(item.externalId()).isEqualTo("SALES-1108167890-20250206");
        });
        assertThat(validator.validate(response)).isEmpty();
    }

    @Test
    void itemIdxIsRequired() throws Exception {
        FranchiseSyncResponse<DailySalesSyncItem> response = read("""
                {
                  "requestId": "mock-daily-sales-20260629-0001",
                  "source": "MOCKOON_FRANCHISE_API",
                  "syncType": "DAILY_SALES",
                  "endpointPath": "/api/daily-sales",
                  "generatedAt": "2026-06-29T10:00:00+09:00",
                  "items": [
                    {
                      "externalId": "SALES-1108167890-20250206",
                      "businessNumber": "1108167890",
                      "franchiseName": "하루온 강남점",
                      "salesDate": "2025-02-06",
                      "salesAmount": 1686445,
                      "orderCount": 101
                    }
                  ]
                }
                """, DailySalesSyncItem.class);

        assertThat(validator.validate(response))
                .extracting(violation -> violation.getPropertyPath().toString())
                .contains("items[0].itemIdx");
    }

    private <T> FranchiseSyncResponse<T> read(String json, Class<T> itemType) throws Exception {
        JavaType type = objectMapper.getTypeFactory()
                .constructParametricType(FranchiseSyncResponse.class, itemType);

        return objectMapper.readValue(json, type);
    }
}
