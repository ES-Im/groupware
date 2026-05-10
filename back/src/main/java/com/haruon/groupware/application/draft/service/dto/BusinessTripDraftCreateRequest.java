package com.haruon.groupware.application.draft.service.dto;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.Set;

@Builder
public record BusinessTripDraftCreateRequest(

        CommonDraftCreateRequest param,

        LocalDateTime startAt,

        LocalDateTime endAt,

        String destination,

        String purpose,

        @Nullable
        Set<Long> participantIds

) {
        public BusinessTripDraftCreateRequest {
                if(param == null || startAt == null || endAt == null || destination == null || purpose == null) {
                        throw new RequiredValueMissingException();
                }

                if(endAt.isBefore(startAt)) throw new EndTimeBeforeStartTimeException();

                if(destination.isBlank()) throw new BlankValueNotAllowedException();
                if(purpose.isBlank()) throw new BlankValueNotAllowedException();
        }
}
