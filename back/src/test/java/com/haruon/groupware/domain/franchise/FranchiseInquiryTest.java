package com.haruon.groupware.domain.franchise;

import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static com.haruon.groupware.domain.franchise.franchiseFixture.getFranchise;
import static com.haruon.groupware.domain.shared.EmpFixture.getApprovedEmp;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class FranchiseInquiryTest {

    @Test
    @DisplayName("질의 생성 테스트")
    void create_Inquiry_inquiry_success() {
        String externalId = "external";
        Franchise franchise = getFranchise();
        String inquirerContact = "010-1234-5678";
        LocalDateTime inquiryAt = LocalDateTime.of(2026,5,1,0,0,0);
        String inquiryTitle = "testTitle";
        String inquiryContent = "testContent";

        FranchiseInquiry inquiry = FranchiseInquiry.createInquiry(externalId, franchise, inquirerContact, inquiryAt, inquiryTitle, inquiryContent);

        assertThat(inquiry).extracting(
                FranchiseInquiry::getExternalId,
                FranchiseInquiry::getFranchise,
                FranchiseInquiry::getInquirerContact,
                FranchiseInquiry::getInquiryAt,
                FranchiseInquiry::getInquiryTitle,
                FranchiseInquiry::getInquiryContent
        ).containsExactly(
                externalId, franchise, inquirerContact, inquiryAt, inquiryTitle, inquiryContent
        );
    }

    @Test
    @DisplayName("질의 생성 테스트 - 해당 가맹점에 담당자가 있을 경우")
    void create_Inquiry_inquiry_check_assigned_emp1() {
        Franchise franchise = getFranchise();
        Emp assignedEmp = getApprovedEmp();
        assignedEmp.getSystemRoles().add(SystemRoleCode.FRANCHISE);

        franchise.changeManager(assignedEmp);

        FranchiseInquiry inquiry = getFranchiseInquiry(franchise);

        assertThat(inquiry.getEmp())
                .as("질의 등록시, 해당 가맹점 담당 직원이 있다면 해당 직원에게 문의가 배정된다.")
                .isEqualTo(assignedEmp);
    }

    @Test
    @DisplayName("질의 생성 테스트 - 해당 가맹점에 담당자가 없을 경우")
    void create_Inquiry_inquiry_check_assigned_emp2() {
        Franchise franchise = getFranchise();

        FranchiseInquiry inquiry = getFranchiseInquiry(franchise);

        assertThat(inquiry.getEmp())
                .as("질의 등록시, 해당 가맹점 담당 직원이 없다면 미배정 상태로 남는다.")
                .isNull();
    }

    @Test
    @DisplayName("질의 생성 테스트 - 담당자 배정")
    void assigned_emp_success() {
        // given
        Franchise franchise = getFranchise();
        FranchiseInquiry inquiry = getFranchiseInquiry(franchise);
        Emp assignedEmp = getApprovedEmp();
        assignedEmp.getSystemRoles().add(SystemRoleCode.FRANCHISE);

        //when
        inquiry.assign(assignedEmp);

        //then
        assertEquals(inquiry.getEmp(), assignedEmp);
    }

    @Test
    @DisplayName("가맹점권한이 없는 사원을 답변담당자로 둘 수 없다.")
    void assigned_emp_fail1() {
        // given
        Franchise franchise = getFranchise();
        FranchiseInquiry inquiry = getFranchiseInquiry(franchise);
        Emp assignedEmp = getApprovedEmp();

        assertThatThrownBy(() ->
                inquiry.assign(assignedEmp)
        ).hasMessage("가맹점 권한이 없음");
    }

    @Test
    @DisplayName("활성화되지 않은 사원을 답변담당자로 둘 수 없다.")
    void assigned_emp_fail2() {
        // given
        Franchise franchise = getFranchise();
        FranchiseInquiry inquiry = getFranchiseInquiry(franchise);
        Emp assignedEmp = getApprovedEmp();
        assignedEmp.getSystemRoles().add(SystemRoleCode.FRANCHISE);
        assignedEmp.changeResignedEmpInfoByHR(LocalDate.now());

        assertThatThrownBy(() ->
                inquiry.assign(assignedEmp)
        ).hasMessage("활성화된 사원이 아님");
    }

    @Test
    @DisplayName("질의 건 변경 테스트")
    void replace_Inquiry_inquiry_success() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());

        String newInquirerContact = "010-1234-5679";
        LocalDateTime newInquiryAt = LocalDateTime.of(2026,5,2,0,0,0);
        String newTitle = "newTitle";
        String newContent = "newContent";

        inquiry.replaceInquiry(newInquirerContact, newInquiryAt, newTitle, newContent);

        assertThat(inquiry).extracting(
                FranchiseInquiry::getInquirerContact,
                FranchiseInquiry::getInquiryAt,
                FranchiseInquiry::getInquiryTitle,
                FranchiseInquiry::getInquiryContent
        ).containsExactly(
                newInquirerContact, newInquiryAt, newTitle, newContent
        );
    }

    @Test
    @DisplayName("질의 건 변경시 변경 사항 중 하나라도 값이 없으면 실패")
    void replace_Inquiry_inquiry_fail() {
        FranchiseInquiry inquiry = getFranchiseInquiry(getFranchise());
        LocalDateTime newInquiryAt = LocalDateTime.of(2026,5,2,0,0,0);
        String newTitle = "newTitle";
        String newContent = "newContent";

        assertThrows(NullPointerException.class, () ->
            inquiry.replaceInquiry(null, newInquiryAt, newTitle, newContent)
        );
    }

    static FranchiseInquiry getFranchiseInquiry(Franchise franchise) {
        return FranchiseInquiry.createInquiry(
                "external", franchise, "010-1234-5678",
                LocalDateTime.of(2026,5,1,0,0,0),
                "testTitle", "testContent");
    }


}