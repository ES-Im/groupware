package com.haruon.groupware.application.franchise.service;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.franchise.provided.AnswerManagement;
import com.haruon.groupware.application.franchise.required.FranchiseInquiryRepository;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.franchise.FranchiseInquiry;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Transactional
@Service
@RequiredArgsConstructor
public class AnswerService implements AnswerManagement {

    private final FranchiseInquiryRepository inquiryRepository;
    private final EmpRepository empRepository;

    @Override
    public void assignEmpToAnswer(long inquiryId, long empId) {
        FranchiseInquiry inquiry = findInquiry(inquiryId);
        Emp assignedEmp = getFranchiseRoleAssignedEmp(empId);

        inquiry.assign(assignedEmp);
    }

    @Override
    public void createAnswerDraft(long inquiryId, long empId, String answer) {
        FranchiseInquiry inquiry = findInquiry(inquiryId);
        Emp assignedEmp = getFranchiseRoleAssignedEmp(empId);

        inquiry.createAnswerDraft(answer, assignedEmp);
    }


    @Override
    public void updateAnswerDraft(long inquiryId, long empId, String answer) {
        FranchiseInquiry inquiry = findInquiry(inquiryId);
        Emp assignedEmp = getFranchiseRoleAssignedEmp(empId);

        inquiry.updateAnswerDraft(answer, assignedEmp);
    }

    @Override
    public void sendAnswer(long inquiryId, long empId, LocalDateTime sentAt) {
        FranchiseInquiry inquiry = findInquiry(inquiryId);
        Emp assignedEmp = getFranchiseRoleAssignedEmp(empId);

        inquiry.submitAnswer(sentAt, assignedEmp);
    }

    private FranchiseInquiry findInquiry(long inquiryId) {
        return inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new IllegalStateException("조회된 문의가 없음"));    // to-do 커스텀 예외처리 필요
    }

    private Emp getFranchiseRoleAssignedEmp(long empId) {
        return FranchiseUtils.getFranchiseRoleAssignedEmp(empRepository, empId);
    }
}
