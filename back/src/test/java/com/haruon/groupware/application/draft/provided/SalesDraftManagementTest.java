package com.haruon.groupware.application.draft.provided;

import com.haruon.groupware.application.TestIntegrationConfig;
import com.haruon.groupware.application.draft.required.DraftRepository;
import com.haruon.groupware.application.draft.service.dto.*;
import com.haruon.groupware.application.empInfo.required.DeptRepository;
import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.franchise.provided.FranchiseManagement;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.domain.draft.Draft;
import com.haruon.groupware.domain.draft.SalesDraft;
import com.haruon.groupware.domain.draft.sub.ApprovalRole;
import com.haruon.groupware.domain.draft.sub.ApprovalStatus;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.empInfo.enums.SystemRoleCode;
import com.haruon.groupware.domain.franchise.Franchise;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

import static com.haruon.groupware.application.dbFixture.EmpFixture.saveApprovedEmp;
import static com.haruon.groupware.application.dbFixture.EmpFixture.saveEmpWithRoleAndDept;
import static com.haruon.groupware.application.dbFixture.FranchiseFixture.getSavedFranchise;
import static com.haruon.groupware.domain.shared.DeptFixture.getDept;
import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;

@Slf4j
@TestIntegrationConfig
record SalesDraftManagementTest(
        DraftRepository draftRepository,
        DeptRepository deptRepository,
        SalesDraftManagement salesDraftManagement,
        EmpRepository empRepository,
        EntityManager entityManager,
        FranchiseRepository franchiseRepository,
        FranchiseManagement franchiseManagement
) {

    @AfterEach
    void tearDown() {
        draftRepository.deleteAll();
        franchiseRepository.deleteAll();
        empRepository.deleteAll();
        deptRepository.deleteAll();
    }

    @Test
    @DisplayName("월별매출보고서 테스트 - 미상신기안서 생성 테스트")
    void createDraft_success() {
        Emp franchiseEmp = getFranchiseEmp("202601001", "franchise1");
        Franchise franchise = getFranchise();

        YearMonth reportMonth = YearMonth.of(2026, 4);
        long salesAmount = 10000L;
        salesDraftManagement.createDraft(
                SalesDraftCreateRequest.builder()
                        .param(CommonDraftCreateRequest.builder()
                                .empId(franchiseEmp.getId())
                                .title("test")
                                .content("test")
                                .build())
                        .franchiseId(franchise.getId())
                        .reportMonth(reportMonth)
                        .salesAmount(salesAmount)
                        .build()
        );

        Draft draft = draftRepository.findByEmp(franchiseEmp).stream().findFirst().orElseThrow();
        assertInstanceOf(SalesDraft.class, draft);

        SalesDraft salesDraft = (SalesDraft) draft;
        assertThat(salesDraft.getApproval().getStatus()).isEqualTo(ApprovalStatus.UNSUBMITTED);
        assertThat(salesDraft).extracting(
                SalesDraft::getFranchise,
                SalesDraft::getReportMonth,
                SalesDraft::getSalesAmount
        ).containsExactly(
                franchise, reportMonth, salesAmount
        );
    }

    @Test
    @DisplayName("월별매출보고서 테스트 - 상신기안서 생성 테스트")
    void createSubmitted_success() {
        Emp franchiseEmp = getFranchiseEmp("202601001", "franchise1");
        Emp approver = saveApprovedEmp(empRepository, "202601002", "approver");
        List<ApproversRequest> approvers = List.of(new ApproversRequest(approver.getId(), ApprovalRole.APPROVER, 1));
        Franchise franchise = getFranchise();

        YearMonth reportMonth = YearMonth.of(2026, 4);
        long salesAmount = 10000L;
        salesDraftManagement.createSubmitted(
                SalesDraftCreateRequest.builder()
                        .param(CommonDraftCreateRequest.builder()
                                .empId(franchiseEmp.getId())
                                .title("test")
                                .content("test")
                                .approvers(approvers)
                                .submittedAt(LocalDateTime.of(2026,3,31,9,0,0))
                                .build())
                        .franchiseId(franchise.getId())
                        .reportMonth(reportMonth)
                        .salesAmount(salesAmount)
                        .build()
        );
        Draft draft = draftRepository.findByEmp(franchiseEmp).stream().findFirst().orElseThrow();
        assertInstanceOf(SalesDraft.class, draft);

        SalesDraft salesDraft = (SalesDraft) draft;

        assertThat(salesDraft.getApproval().getStatus()).isEqualTo(ApprovalStatus.WAITING);

        assertThat(salesDraft).extracting(
                SalesDraft::getFranchise,
                SalesDraft::getReportMonth,
                SalesDraft::getSalesAmount
        ).containsExactly(
                franchise, reportMonth, salesAmount
        );
    }

    @Test
    @DisplayName("월별매출보고서 테스트 - 미상신 기안서 수정 테스트")
    void update_draft_success() {
        Emp franchiseEmp = getFranchiseEmp("202601001", "franchise1");
        Franchise franchise = getFranchise();
        YearMonth editedReportMonth = YearMonth.of(2026, 3);
        long editedSalesAmount = 20000L;
        SalesDraft draft = saveDraft(franchiseEmp, franchise.getId(), editedReportMonth, editedSalesAmount);

        salesDraftManagement.updateDraft(
                SalesDraftUpdateRequest.builder()
                        .param(
                                CommonDraftUpdateRequest.builder()
                                        .drafterId(franchiseEmp.getId())
                                        .draftId(draft.getId())
                                .build())
                        .franchiseId(franchise.getId())
                        .reportMonth(editedReportMonth)
                        .salesAmount(editedSalesAmount)
                .build()
        );

        SalesDraft foundDraft = (SalesDraft) draftRepository.findById(draft.getId()).orElseThrow();

        assertThat(foundDraft).extracting(
                SalesDraft::getReportMonth, SalesDraft::getSalesAmount
        ).containsExactly(
                editedReportMonth, editedSalesAmount
        );
    }



    private Franchise getFranchise() {
        return getSavedFranchise(deptRepository, empRepository, franchiseRepository, franchiseManagement);
    }

    private SalesDraft saveDraft(
            Emp franchiseEmp,
            long franchiseId,
            YearMonth targetMonth,
            long salesAmount
    ) {
        salesDraftManagement.createDraft(
                SalesDraftCreateRequest.builder()
                        .param(CommonDraftCreateRequest.builder()
                                .empId(franchiseEmp.getId())
                                .title("test")
                                .content("test")
                                .build())
                        .franchiseId(franchiseId)
                        .reportMonth(targetMonth)
                        .salesAmount(salesAmount)
                .build()
        );

        return (SalesDraft) draftRepository.findByEmp(franchiseEmp).stream().findFirst().orElseThrow();
    }


    private SalesDraft saveSubmittedDraft(
            Emp franchiseEmp,
            Emp approver,
            long franchiseId,
            YearMonth targetMonth,
            long salesAmount
    ) {
        List<ApproversRequest> approvers = List.of(new ApproversRequest(approver.getId(), ApprovalRole.APPROVER, 1));

        salesDraftManagement.createDraft(
                SalesDraftCreateRequest.builder()
                        .param(CommonDraftCreateRequest.builder()
                                .empId(franchiseEmp.getId())
                                .title("test")
                                .content("test")
                                .approvers(approvers)
                                .submittedAt(LocalDateTime.of(2026,3,31,9,0,0))
                                .build())
                        .franchiseId(franchiseId)
                        .reportMonth(targetMonth)
                        .salesAmount(salesAmount)
                .build()
        );

        return (SalesDraft) draftRepository.findByEmp(franchiseEmp).stream().findFirst().orElseThrow();
    }

    private Emp getFranchiseEmp(String empNo, String loginId) {
        return saveEmpWithRoleAndDept(
                empRepository, deptRepository, empNo, loginId, getDept("001", "franchise"), SystemRoleCode.FRANCHISE
        );
    }

}