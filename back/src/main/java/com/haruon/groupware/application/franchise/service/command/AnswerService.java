package com.haruon.groupware.application.franchise.service.command;

import com.haruon.groupware.application.empInfo.emp.required.EmpRepository;
import com.haruon.groupware.application.exception.franchise.FranchiseInquiryNotFoundException;
import com.haruon.groupware.application.franchise.provided.forCommand.AnswerManagement;
import com.haruon.groupware.application.franchise.required.FranchiseInquiryRepository;
import com.haruon.groupware.application.franchise.service.FranchiseUtils;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.franchise.FranchiseInquiry;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.utils.AuthValidator.checkFranchiseRoleEmp;

@Transactional
@Service
@RequiredArgsConstructor
public class AnswerService implements AnswerManagement {

    private final FranchiseInquiryRepository inquiryRepository;
    private final EmpRepository empRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public void assignEmpToAnswer(long inquiryId, long editorId, long empId) {
        checkFranchiseRoleEmp(authorizationQueryRepository, editorId);

        FranchiseInquiry inquiry = findInquiry(inquiryId);
        Emp assignedEmp = getFranchiseRoleAssignedEmp(empId);

        inquiry.assign(assignedEmp);
    }

    @Override
    public void createAnswerDraft(long inquiryId, long editorId, String answer) {
        FranchiseInquiry inquiry = findInquiry(inquiryId);
        Emp assignedEmp = getFranchiseRoleAssignedEmp(editorId);

        inquiry.createAnswerDraft(answer, assignedEmp);
    }


    @Override
    public void updateAnswerDraft(long inquiryId, long editorId, String answer) {
        FranchiseInquiry inquiry = findInquiry(inquiryId);
        Emp assignedEmp = getFranchiseRoleAssignedEmp(editorId);

        inquiry.updateAnswerDraft(answer, assignedEmp);
    }

    @Override
    public void sendAnswer(long inquiryId, long editorId, LocalDateTime sentAt) {
        checkFranchiseRoleEmp(authorizationQueryRepository, editorId);

        FranchiseInquiry inquiry = findInquiry(inquiryId);
        Emp assignedEmp = getFranchiseRoleAssignedEmp(editorId);

        inquiry.submitAnswer(sentAt, assignedEmp);
    }

    private FranchiseInquiry findInquiry(long inquiryId) {
        return inquiryRepository.findById(inquiryId)
                .orElseThrow(FranchiseInquiryNotFoundException::new);
    }

    private Emp getFranchiseRoleAssignedEmp(long empId) {
        return FranchiseUtils.getFranchiseRoleAssignedEmp(
                empRepository,
                authorizationQueryRepository,
                empId
        );
    }
}
