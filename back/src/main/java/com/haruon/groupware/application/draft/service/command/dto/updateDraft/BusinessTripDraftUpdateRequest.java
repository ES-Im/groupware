package com.haruon.groupware.application.draft.service.command.dto.updateDraft;

import com.haruon.groupware.application.exception.common.BlankValueNotAllowedException;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;

@Builder
public record BusinessTripDraftUpdateRequest(

        @Valid @Nullable
        CommonDraftUpdateRequest param,

        @Nullable
        LocalDateTime startAt,

        @Nullable
        LocalDateTime endAt,

        @Nullable
        @Size(max = 200)
        String destination,

        @Nullable
        @Size(max = 200)
        String purpose

) {
        public BusinessTripDraftUpdateRequest {
                if(
                        param == null &&
                        startAt == null && endAt == null && destination == null && purpose == null
                ) throw new RequiredValueMissingException();


                if(destination != null && destination.isBlank()) throw new BlankValueNotAllowedException();

                if(purpose != null && purpose.isBlank()) throw new BlankValueNotAllowedException();

        }
}
