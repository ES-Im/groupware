package com.haruon.groupware.domain;

import com.haruon.groupware.domain.shared.Email;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CompanyTest {

    @Test
    @DisplayName("회사 정보 생성 테스트")
    void register_company_success() {
        Company company = Company.register(
                "하루온",
                "서울특별시 강남구",
                "contact@haruon.com",
                "02-1234-5678",
                "홍길동",
                "https://haruon.com",
                LocalDateTime.of(2026, 1, 1, 9, 0)
        );

        assertThat(company).extracting(
                Company::getCompanyName,
                Company::getLocation,
                Company::getPresentedEmail,
                Company::getPresentedExternalNo,
                Company::getOwnerName,
                Company::getHomePageURL,
                Company::getEditedAt
        ).containsExactly(
                "하루온",
                "서울특별시 강남구",
                new Email("contact@haruon.com"),
                "02-1234-5678",
                "홍길동",
                "https://haruon.com",
                LocalDateTime.of(2026, 1, 1, 9, 0)
        );
    }

    @Test
    @DisplayName("회사 기본 정보 이력 생성 테스트")
    void edit_company_info_success() {
        Company company = getCompany();
        LocalDateTime editedAt = LocalDateTime.of(2026, 1, 2, 9, 0);

        Company editedCompany = company.editCompanyInfo("하루온 그룹", "인천광역시 부평구", "김대표", editedAt);

        assertThat(editedCompany).extracting(
                Company::getCompanyName,
                Company::getLocation,
                Company::getOwnerName,
                Company::getEditedAt
        ).containsExactly(
                "하루온 그룹",
                "인천광역시 부평구",
                "김대표",
                editedAt
        );
        assertThat(company.getCompanyName()).isEqualTo("하루온");
    }

    @Test
    @DisplayName("회사 대표 연락처 이력 생성 테스트")
    void edit_presented_contact_success() {
        Company company = getCompany();
        LocalDateTime editedAt = LocalDateTime.of(2026, 1, 2, 9, 0);

        Company editedCompany = company.editPresentedContact("help@haruon.com", "032-123-4567", editedAt);

        assertThat(editedCompany.getPresentedEmail()).isEqualTo(new Email("help@haruon.com"));
        assertThat(editedCompany.getPresentedExternalNo()).isEqualTo("032-123-4567");
        assertThat(editedCompany.getEditedAt()).isEqualTo(editedAt);
        assertThat(company.getPresentedEmail()).isEqualTo(new Email("contact@haruon.com"));
    }

    @Test
    @DisplayName("회사 홈페이지 URL 이력 생성 테스트")
    void edit_home_page_url_success() {
        Company company = getCompany();
        LocalDateTime editedAt = LocalDateTime.of(2026, 1, 2, 9, 0);

        Company editedCompany = company.editHomePageURL("http://groupware.haruon.com", editedAt);

        assertThat(editedCompany.getHomePageURL()).isEqualTo("http://groupware.haruon.com");
        assertThat(editedCompany.getEditedAt()).isEqualTo(editedAt);
        assertThat(company.getHomePageURL()).isEqualTo("https://haruon.com");
    }

    @Test
    @DisplayName("회사 정보 이력 생성 테스트 - 변경할 내용이 없으면 실패")
    void edit_company_info_without_changes_fail() {
        Company company = getCompany();

        assertThatThrownBy(() -> company.editCompanyInfo(null, null, null, LocalDateTime.of(2026, 1, 2, 9, 0)))
                .hasMessage("변경할 내용이 없습니다.");
    }

    @Test
    @DisplayName("회사 정보 이력 생성 테스트 - 수정일시가 기존 수정일시 이후가 아니면 실패")
    void edit_company_info_with_invalid_edited_at_fail() {
        Company company = getCompany();

        assertThatThrownBy(() -> company.editCompanyInfo("하루온 그룹", null, null, LocalDateTime.of(2026, 1, 1, 9, 0)))
                .hasMessage("수정일시는 기존 수정일시 이후여야 합니다.");
    }

    @Test
    @DisplayName("회사 정보 생성 테스트 - 공백 값이면 실패")
    void register_company_with_blank_value_fail() {
        assertThatThrownBy(() ->
                Company.register(
                        " ",
                        "서울특별시 강남구",
                        "contact@haruon.com",
                        "02-1234-5678",
                        "홍길동",
                        "https://haruon.com",
                        LocalDateTime.of(2026, 1, 1, 9, 0)
                )
        ).hasMessage("회사명은 공백일 수 없습니다.");
    }

    @Test
    @DisplayName("회사 정보 생성 테스트 - 홈페이지 URL 형식이 올바르지 않으면 실패")
    void register_company_with_invalid_home_page_url_fail() {
        assertThatThrownBy(() ->
                Company.register(
                        "하루온",
                        "서울특별시 강남구",
                        "contact@haruon.com",
                        "02-1234-5678",
                        "홍길동",
                        "haruon.com",
                        LocalDateTime.of(2026, 1, 1, 9, 0)
                )
        ).hasMessage("홈페이지 URL 형식이 올바르지 않습니다.");
    }

    private Company getCompany() {
        return Company.register(
                "하루온",
                "서울특별시 강남구",
                "contact@haruon.com",
                "02-1234-5678",
                "홍길동",
                "https://haruon.com",
                LocalDateTime.of(2026, 1, 1, 9, 0)
        );
    }
}
