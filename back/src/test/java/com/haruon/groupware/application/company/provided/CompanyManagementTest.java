package com.haruon.groupware.application.company.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyContactUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyHomePageUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyInfoUpdateRequest;
import com.haruon.groupware.application.company.companyService.dto.request.CompanyRegisterRequest;
import com.haruon.groupware.application.company.companyService.dto.response.CompanyInfoResponse;
import com.haruon.groupware.application.company.required.CompanyRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.exception.common.role.PermissionDeniedException;
import com.haruon.groupware.application.exception.company.CompanyAlreadyExistsException;
import com.haruon.groupware.application.exception.company.CompanyNotFoundException;
import com.haruon.groupware.domain.empInfo.Emp;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveAdmin;
import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@TestIntegrationConfig
record CompanyManagementTest(
        CompanyManagement companyManagement,
        CompanyRetriever companyRetriever,
        CompanyRepository companyRepository,
        EmpRepository empRepository
) {

    @BeforeEach
    void setUp() {
        cleanDatabase();
    }

    @AfterEach
    void tearDown() {
        cleanDatabase();
    }

    private void cleanDatabase() {
        companyRepository.deleteAll();
        empRepository.deleteAll();
    }

    @Test
    @DisplayName("ADMIN은 회사 정보를 최초 등록할 수 있다")
    void register_company_success() {
        Emp admin = saveAdmin(empRepository);

        long companyId = companyManagement.registerCompany(admin.getId(), createRegisterRequest());

        CompanyInfoResponse response = companyRetriever.retrieveCompanyInfo();
        assertThat(response.companyId()).isEqualTo(companyId);
        assertThat(response.companyName()).isEqualTo("하루온");
        assertThat(response.presentedEmail()).isEqualTo("contact@haruon.com");
        assertThat(response.editedAt()).isEqualTo(LocalDateTime.of(2026, 1, 1, 9, 0));
    }

    @Test
    @DisplayName("일반 사원은 회사 정보를 최초 등록할 수 없다")
    void register_company_by_emp_fail() {
        Emp emp = saveApprovedEmp(empRepository);

        assertThatThrownBy(() -> companyManagement.registerCompany(emp.getId(), createRegisterRequest()))
                .isInstanceOf(PermissionDeniedException.class);
    }

    @Test
    @DisplayName("회사 정보는 중복 등록할 수 없다")
    void register_company_duplicate_fail() {
        Emp admin = saveAdmin(empRepository);
        companyManagement.registerCompany(admin.getId(), createRegisterRequest());

        assertThatThrownBy(() -> companyManagement.registerCompany(admin.getId(), createRegisterRequest()))
                .isInstanceOf(CompanyAlreadyExistsException.class);
    }

    @Test
    @DisplayName("ADMIN은 회사 기본 정보 이력을 추가할 수 있다")
    void update_company_info_success() {
        Emp admin = saveAdmin(empRepository);
        companyManagement.registerCompany(admin.getId(), createRegisterRequest());

        CompanyInfoUpdateRequest request = CompanyInfoUpdateRequest.builder()
                .companyName("하루온 그룹")
                .location("인천광역시 부평구")
                .ownerName("김대표")
                .editedAt(LocalDateTime.of(2026, 1, 2, 9, 0))
                .build();
        companyManagement.updateCompanyInfo(admin.getId(), request);

        CompanyInfoResponse response = companyRetriever.retrieveCompanyInfo();
        assertThat(companyRepository.count()).isEqualTo(2);
        assertThat(response.companyName()).isEqualTo("하루온 그룹");
        assertThat(response.location()).isEqualTo("인천광역시 부평구");
        assertThat(response.ownerName()).isEqualTo("김대표");
        assertThat(response.presentedEmail()).isEqualTo("contact@haruon.com");
        assertThat(response.editedAt()).isEqualTo(LocalDateTime.of(2026, 1, 2, 9, 0));
    }

    @Test
    @DisplayName("ADMIN은 회사 대표 연락처 이력을 추가할 수 있다")
    void update_presented_contact_success() {
        Emp admin = saveAdmin(empRepository);
        companyManagement.registerCompany(admin.getId(), createRegisterRequest());

        CompanyContactUpdateRequest request = CompanyContactUpdateRequest.builder()
                .presentedEmail("help@haruon.com")
                .presentedExternalNo("032-123-4567")
                .editedAt(LocalDateTime.of(2026, 1, 2, 9, 0))
                .build();
        companyManagement.updatePresentedContact(admin.getId(), request);

        CompanyInfoResponse response = companyRetriever.retrieveCompanyInfo();
        assertThat(companyRepository.count()).isEqualTo(2);
        assertThat(response.presentedEmail()).isEqualTo("help@haruon.com");
        assertThat(response.presentedExternalNo()).isEqualTo("032-123-4567");
        assertThat(response.companyName()).isEqualTo("하루온");
    }

    @Test
    @DisplayName("ADMIN은 회사 홈페이지 URL 이력을 추가할 수 있다")
    void update_home_page_url_success() {
        Emp admin = saveAdmin(empRepository);
        companyManagement.registerCompany(admin.getId(), createRegisterRequest());

        CompanyHomePageUpdateRequest request = CompanyHomePageUpdateRequest.builder()
                .homePageURL("http://groupware.haruon.com")
                .editedAt(LocalDateTime.of(2026, 1, 2, 9, 0))
                .build();
        companyManagement.updateHomePageURL(admin.getId(), request);

        CompanyInfoResponse response = companyRetriever.retrieveCompanyInfo();
        assertThat(companyRepository.count()).isEqualTo(2);
        assertThat(response.homePageURL()).isEqualTo("http://groupware.haruon.com");
        assertThat(response.editedAt()).isEqualTo(LocalDateTime.of(2026, 1, 2, 9, 0));
    }

    @Test
    @DisplayName("회사 정보가 없으면 조회할 수 없다")
    void retrieve_company_without_company_fail() {
        assertThatThrownBy(companyRetriever::retrieveCompanyInfo)
                .isInstanceOf(CompanyNotFoundException.class);
    }

    @Test
    @DisplayName("회사 정보 이력은 기존 수정일시 이후로만 추가할 수 있다")
    void update_company_info_with_invalid_edited_at_fail() {
        Emp admin = saveAdmin(empRepository);
        companyManagement.registerCompany(admin.getId(), createRegisterRequest());

        CompanyInfoUpdateRequest request = CompanyInfoUpdateRequest.builder()
                .companyName("하루온 그룹")
                .editedAt(LocalDateTime.of(2026, 1, 1, 9, 0))
                .build();

        assertThatThrownBy(() -> companyManagement.updateCompanyInfo(admin.getId(), request))
                .hasMessage("수정일시는 기존 수정일시 이후여야 합니다.");
    }

    private CompanyRegisterRequest createRegisterRequest() {
        return CompanyRegisterRequest.builder()
                .companyName("하루온")
                .location("서울특별시 강남구")
                .presentedEmail("contact@haruon.com")
                .presentedExternalNo("02-1234-5678")
                .ownerName("홍길동")
                .homePageURL("https://haruon.com")
                .editedAt(LocalDateTime.of(2026, 1, 1, 9, 0))
                .build();
    }
}
