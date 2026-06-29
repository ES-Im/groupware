package com.haruon.groupware.application.syncRequest.provided;

import com.haruon.groupware.application.syncRequest.service.dto.*;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.executable.ExecutableValidator;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ExternalFranchiseDataCollectorValidationTest {

    private final ExternalFranchiseDataCollector collector = new StubExternalFranchiseDataCollector();

    private final ExecutableValidator validator = Validation.buildDefaultValidatorFactory()
            .getValidator()
            .forExecutables();

    @Test
    void validateCollectReturnValue() throws Exception {
        Method method = ExternalFranchiseDataCollector.class.getMethod("collectDailySales");

        Set<ConstraintViolation<ExternalFranchiseDataCollector>> violations =
                validator.validateReturnValue(collector, method, null);

        assertThat(violations)
                .extracting(ConstraintViolation::getPropertyPath)
                .extracting(Object::toString)
                .containsExactly("collectDailySales.<return value>");
    }

    @Test
    void validateStateTransitionParameters() throws Exception {
        Method method = ExternalFranchiseDataCollector.class.getMethod(
                "fail",
                Long.class,
                LocalDateTime.class,
                String.class,
                int.class
        );

        Set<ConstraintViolation<ExternalFranchiseDataCollector>> violations =
                validator.validateParameters(collector, method, new Object[]{null, null, " ", 0});

        assertThat(violations)
                .extracting(ConstraintViolation::getPropertyPath)
                .extracting(Object::toString)
                .containsExactlyInAnyOrder(
                        "fail.syncRequestId",
                        "fail.failedAt",
                        "fail.errorMessage",
                        "fail.maxFailureCount"
                );
    }

    private static class StubExternalFranchiseDataCollector implements ExternalFranchiseDataCollector {

        @Override
        public FranchiseSyncResponse<FranchiseExternalDailySalesRequest> collectDailySales() {
            return null;
        }

        @Override
        public FranchiseSyncResponse<FranchiseInquiryRequest> collectInquiries() {
            return null;
        }

        @Override
        public FranchiseSyncResponse<EducationApplicationRequest> collectEducationApplications() {
            return null;
        }

        @Override
        public FranchiseSyncResponse<EducationApplyCancellationRequest> collectEducationApplicationCancellations() {
            return null;
        }

        @Override
        public void start(Long syncRequestId, LocalDateTime startedAt) {
        }

        @Override
        public void complete(Long syncRequestId, LocalDateTime completedAt) {
        }

        @Override
        public void fail(Long syncRequestId, LocalDateTime failedAt, String errorMessage, int maxFailureCount) {
        }

        @Override
        public void expireProcessing(LocalDateTime current, int maxFailureCount) {
        }
    }
}
