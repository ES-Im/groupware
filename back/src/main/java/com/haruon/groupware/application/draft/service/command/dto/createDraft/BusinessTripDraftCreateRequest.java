package com.haruon.groupware.application.draft.service.command.dto.createDraft;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.EndTimeBeforeStartTimeException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.Set;

@Builder
public record BusinessTripDraftCreateRequest(

        @NotNull @Valid
        CommonDraftCreateRequest param,

        @NotNull
        LocalDateTime startAt,

        @NotNull
        LocalDateTime endAt,

        @NotBlank
        @Size(max = 200)
        String destination,

        @NotBlank
        @Size(max = 200)
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
