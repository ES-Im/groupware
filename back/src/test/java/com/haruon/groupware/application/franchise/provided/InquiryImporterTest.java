package com.haruon.groupware.application.franchise.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.franchise.requried.FranchiseInquiryRepository;
import com.haruon.groupware.application.franchise.requried.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.dto.InquiryRequest;
import com.haruon.groupware.domain.franchise.Franchise;
import com.haruon.groupware.domain.franchise.FranchiseInquiry;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.dbFixture.FranchiseFixture.getSavedFranchise;
import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@TestIntegrationConfig
record InquiryImporterTest(
        FranchiseInquiryRepository inquiryRepository,
        FranchiseRepository franchiseRepository,
        EmpRepository empRepository,
        DeptRepository deptRepository,
        InquiryImporter importer,
        FranchiseManagement franchiseManagement
) {

    @AfterEach
    void tearDown() {
        inquiryRepository.deleteAll();
        franchiseRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Test
    @DisplayName("질의 응답 테스트 - DB에 externalId가 없으면 질의를 신규 등록한다.")
    void createInquiry_success() {
        Franchise franchise = getSavedFranchise(
                deptRepository, empRepository, franchiseRepository, franchiseManagement
        );

        String externalId = "external";
        String inquirerContact = "010-1234-5678";
        LocalDateTime inquiryAt = LocalDateTime.of(2026,4,1,9,0,0);
        String inquiryTitle = "title";
        String inquiryContent = "content";

        long inquiryId = importer.importInquiry(
                franchise.getId(),
                InquiryRequest.builder()
                        .externalId(externalId)
                        .inquirerContact(inquirerContact)
                        .inquiryAt(inquiryAt)
                        .inquiryTitle(inquiryTitle)
                        .inquiryContent(inquiryContent)
                .build()
        );

        FranchiseInquiry inquiry = inquiryRepository.findById(inquiryId).orElseThrow();

        assertThat(inquiry).extracting(
                FranchiseInquiry::getExternalId,
                FranchiseInquiry::getInquirerContact,
                FranchiseInquiry::getInquiryAt,
                FranchiseInquiry::getInquiryTitle,
                FranchiseInquiry::getInquiryContent,
                FranchiseInquiry::getFranchise
        ).containsExactly(
                externalId, inquirerContact, inquiryAt, inquiryTitle, inquiryContent, franchise
        );

        assertThat(inquiry.getEmp())
                .as("해당 가맹점 담당자가 있으면 그 담당자에게 질의가 배정된다.")
                .isEqualTo(franchise.getEmp());
    }

    @Test
    @DisplayName("질의 응답 교체 테스트 - DB에 externalId가 있으면 질의 응답을 갱신하고 새 데이터를 만들지 않는다")
    void replaceSales_success() {
        Franchise franchise = getSavedFranchise(
                deptRepository, empRepository, franchiseRepository, franchiseManagement
        );
        String externalId = "external";
        long inquiryId = importer.importInquiry(
                franchise.getId(),
                InquiryRequest.builder()
                        .externalId(externalId)
                        .inquirerContact("010-1234-5678")
                        .inquiryAt(LocalDateTime.of(2026, 4, 1, 9, 0, 0))
                        .inquiryTitle("title")
                        .inquiryContent("content")
                        .build()
        );

        String newInquirerContact = "010-1234-9999";
        LocalDateTime newInquiryAt = LocalDateTime.of(2026, 4, 2, 9, 0, 0);
        String newInquiryTitle = "newTitle";
        String newInquiryContent = "newContent";

        importer.importInquiry(
                franchise.getId(),
                InquiryRequest.builder()
                        .externalId(externalId)
                        .inquirerContact(newInquirerContact)
                        .inquiryAt(newInquiryAt)
                        .inquiryTitle(newInquiryTitle)
                        .inquiryContent(newInquiryContent)
                        .build()
        );

        FranchiseInquiry inquiry = inquiryRepository.findById(inquiryId).orElseThrow();

        assertThat(inquiry).extracting(
                FranchiseInquiry::getExternalId,
                FranchiseInquiry::getInquirerContact,
                FranchiseInquiry::getInquiryAt,
                FranchiseInquiry::getInquiryTitle,
                FranchiseInquiry::getInquiryContent,
                FranchiseInquiry::getFranchise
        ).containsExactly(
                externalId, newInquirerContact, newInquiryAt, newInquiryTitle, newInquiryContent, franchise
        );

        assertThat(inquiryRepository.count())
                .as("교체시, row가 더 증가하진 않는다")
                .isEqualTo(1);

    }

}