package com.haruon.groupware.adapter.persistence.franchise;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.dept.required.DeptRepository;
import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.franchise.required.EducationRepository;
import com.haruon.groupware.application.franchise.required.FranchiseEducationQueryRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationApplicantsResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationDetailResponse;
import com.haruon.groupware.application.franchise.service.query.dto.education.EducationsResponse;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.franchise.Education;
import com.haruon.groupware.domain.franchise.Franchise;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static com.haruon.groupware.application.dbFixture.FranchiseFixture.getSavedFranchiseEmp;
import static org.assertj.core.api.Assertions.assertThat;

@TestIntegrationConfig
@Transactional
record FranchiseEducationQueryRepositoryAdapterTest(
        FranchiseEducationQueryRepository educationQueryRepository,
        EducationRepository educationRepository,
        FranchiseRepository franchiseRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository
) {

    @AfterEach
    void tearDown() {
        educationRepository.deleteAll();
        franchiseRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Test
    @DisplayName("교육 목록 조회 - 신청이 없는 교육도 조회하고 정원 여부는 신청 합계로 계산한다")
    void findEducationList_success() {
        Education emptyEducation = saveEducation(20L);
        Education fullEducation = saveEducation(30L);
        apply(fullEducation, saveFranchise(), "app-1", 10L);
        apply(fullEducation, saveFranchise(), "app-2", 20L);

        List<EducationsResponse> responses = educationQueryRepository.findEducationList(
                LocalDateTime.of(2026, 5, 1, 0, 0),
                LocalDateTime.of(2026, 6, 1, 0, 0)
        );

        assertThat(responses).extracting(
                EducationsResponse::id,
                EducationsResponse::isFull
        ).containsExactly(
                org.assertj.core.groups.Tuple.tuple(emptyEducation.getId(), false),
                org.assertj.core.groups.Tuple.tuple(fullEducation.getId(), true)
        );
    }

    @Test
    @DisplayName("교육 상세 조회 - 신청 합계와 잔여 정원을 조회한다")
    void findEducationById_success() {
        Education education = saveEducation(30L);
        apply(education, saveFranchise(), "app-1", 10L);
        apply(education, saveFranchise(), "app-2", 15L);

        EducationDetailResponse response = educationQueryRepository.findEducationById(education.getId()).orElseThrow();

        assertThat(response).extracting(
                EducationDetailResponse::id,
                EducationDetailResponse::date,
                EducationDetailResponse::startAt,
                EducationDetailResponse::appliedCount,
                EducationDetailResponse::capacity,
                EducationDetailResponse::remainingCapacity
        ).containsExactly(
                education.getId(),
                LocalDate.of(2026, 5, 1),
                LocalTime.of(9, 30),
                25L,
                30L,
                5L
        );
    }

    @Test
    @DisplayName("교육 신청자 조회 - 신청 가맹점 정보를 함께 조회한다")
    void findApplicantsById_success() {
        Education education = saveEducation(30L);
        Franchise franchise = saveFranchise();
        String externalId = apply(education, franchise, "app-1", 10L);

        Page<EducationApplicantsResponse> response = educationQueryRepository.findApplicantsById(
                education.getId(), PageRequest.of(0, 10)
        );

        assertThat(response.getContent()).singleElement().satisfies(applicant ->
                assertThat(applicant).extracting(
                        EducationApplicantsResponse::externalId,
                        EducationApplicantsResponse::franchiseId,
                        EducationApplicantsResponse::franchiseName,
                        EducationApplicantsResponse::contactEmail,
                        EducationApplicantsResponse::appliedCount
                ).containsExactly(
                        externalId,
                        franchise.getId(),
                        franchise.getFranchiseName(),
                        franchise.getContactEmail().email(),
                        10L
                )
        );
    }

    private Education saveEducation(Long capacity) {
        String token = token();
        Emp emp = getSavedFranchiseEmp(
                deptRepository, empRepository,
                "202699001",
                "education-query"
        );
        Education education = Education.create(
                emp,
                LocalDateTime.of(2026, 5, 1, 9, 30),
                "Query Room " + token,
                "Query Title " + token,
                "Query Content " + token,
                capacity
        );
        education.activate();
        return educationRepository.save(education);
    }

    private Franchise saveFranchise() {
        String token = token();
        return franchiseRepository.save(Franchise.create(
                "000-00-00000",
                "Query Franchise " + token,
                "Seoul " + token,
                "Owner " + token,
                "010-1234-5678",
                "education-query-" + token + "@example.com",
                null
        ));
    }

    private String apply(Education education, Franchise franchise, String externalId, Long appliedCount) {
        String savedExternalId = externalId + "-" + token();
        education.applyByFranchise(
                savedExternalId,
                franchise,
                appliedCount,
                LocalDateTime.of(2026, 4, 1, 10, 0)
        );
        return savedExternalId;
    }

    private String token() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }
}
