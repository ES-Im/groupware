package com.haruon.groupware.application.franchise.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.franchise.required.EducationRepository;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.dto.ApplicationRequest;
import com.haruon.groupware.application.franchise.service.dto.EducationCreateRequest;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.franchise.Education;
import com.haruon.groupware.domain.franchise.EducationApplication;
import com.haruon.groupware.domain.franchise.Franchise;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.dbFixture.FranchiseFixture.getSavedFranchise;
import static com.haruon.groupware.application.dbFixture.FranchiseFixture.getSavedFranchiseEmp;
import static org.assertj.core.api.Assertions.assertThat;

@TestIntegrationConfig
record EducationApplicationImporterTest(
        FranchiseRepository franchiseRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository,
        EducationRepository educationRepository,
        FranchiseManagement franchiseManagement,
        EducationManagement educationManagement,
        EducationApplicationImporter educationApplicationImporter,
        EntityManager entityManager
) {

    @AfterEach
    void tearDown() {
        educationRepository.deleteAll();
        franchiseRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Transactional
    @Test
    @DisplayName("신규 지원서 생성 테슽")
    void applyByFranchise_success() {
        Franchise franchise = getFranchise();
        Emp franchiseEmp = getFranchiseEmp("202601001", "franchise1");
        long educationId = getEducation(franchiseEmp);
        educationManagement.activate(educationId, franchiseEmp.getId());

        entityManager.flush();
        entityManager.clear();

        String externalId = "externalId";
        long franchiseId = franchise.getId();
        Long appliedCount = 20L;
        LocalDateTime appliedAt = LocalDateTime.of(2026,4,1,0,0,0);

        educationApplicationImporter.importEducationApplication(
                educationId,
                ApplicationRequest.builder()
                        .externalId(externalId)
                        .franchiseId(franchiseId)
                        .appliedCount(appliedCount)
                        .appliedAt(appliedAt)
                .build()
        );

        entityManager.flush();
        entityManager.clear();

        Education education = educationRepository.findById(educationId).orElseThrow();

        assertThat(education.getEducationApplications()).singleElement().extracting(
                EducationApplication::getFranchise,
                EducationApplication::getExternalId,
                EducationApplication::getAppliedCount,
                EducationApplication::getAppliedAt
        ).containsExactly(
                franchise, externalId, appliedCount, appliedAt
        );
    }

    @Test
    @Transactional
    @DisplayName("수정 지원서 반영")
    void replace_application_success() {
        Franchise franchise = getFranchise();
        Emp franchiseEmp = getFranchiseEmp("202601001", "franchise1");
        long educationId = getEducation(franchiseEmp);

        String externalId = "externalId";
        getEducationHasApplication(externalId, franchise, educationId, franchiseEmp.getId());

        entityManager.flush();
        entityManager.clear();

        long newAppliedCount = 15L;
        LocalDateTime newAppliedAt = LocalDateTime.of(2026,4,2,0,0,0);

        educationApplicationImporter.importEducationApplication(
            educationId,
            ApplicationRequest.builder()
                    .externalId(externalId)
                    .franchiseId(franchise.getId())
                    .appliedCount(newAppliedCount)
                    .appliedAt(newAppliedAt)
                    .build()
        );

        entityManager.flush();
        entityManager.clear();

        Education education = educationRepository.findById(educationId).orElseThrow();

        assertThat(education.getEducationApplications()).singleElement().extracting(
                EducationApplication::getAppliedCount,
                EducationApplication::getAppliedAt
        ).containsExactly(
                newAppliedCount, newAppliedAt
        );
    }

    @Test
    @Transactional
    @DisplayName("지원 취소")
    void clear_application_success() {
        Franchise franchise = getFranchise();
        Emp franchiseEmp = getFranchiseEmp("202601001", "franchise1");
        long educationId = getEducation(franchiseEmp);

        String externalId = "externalId";
        getEducationHasApplication(externalId, franchise, educationId, franchiseEmp.getId());

        entityManager.flush();
        entityManager.clear();

        educationApplicationImporter.cancelEducationApplication(
                educationId, franchise.getId(), externalId
        );

        entityManager.flush();
        entityManager.clear();

        Education education = educationRepository.findById(educationId).orElseThrow();

        assertThat(education.getEducationApplications()).isEmpty();
    }

    private void getEducationHasApplication(String externalId, Franchise franchise, long educationId, long franchiseEmpId) {
        educationManagement.activate(educationId, franchiseEmpId);

        long franchiseId = franchise.getId();
        Long appliedCount = 20L;
        LocalDateTime appliedAt = LocalDateTime.of(2026,4,1,0,0,0);

        educationApplicationImporter.importEducationApplication(
                educationId,
                ApplicationRequest.builder()
                        .externalId(externalId)
                        .franchiseId(franchiseId)
                        .appliedCount(appliedCount)
                        .appliedAt(appliedAt)
                        .build()
        );
    }


    private Franchise getFranchise() {
        return getSavedFranchise(
                deptRepository, empRepository, franchiseRepository, franchiseManagement
        );
    }

    private long getEducation(Emp franchiseEmp) {
        return educationManagement.createEducation(
                franchiseEmp.getId(),
                EducationCreateRequest.builder()
                        .educationDate(LocalDateTime.of(2026, 5, 1, 9, 0, 0))
                        .place("테스트 강남점")
                        .title("테스트타이틀")
                        .content("테스트교육내용")
                        .capacity(20L)
                        .build()
        );
    }

    private Emp getFranchiseEmp(String empNo, String loginId) {
        return getSavedFranchiseEmp(deptRepository, empRepository, empNo, loginId);
    }
}