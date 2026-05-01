package com.haruon.groupware.application.franchise.provided;

import java.time.LocalDateTime;

/**
 * 가맹점 문의 관리 및 답변을 외부 시스템에 전송하는 Port
 */
public interface AnswerManagement {

    void assignEmpToAnswer(long inquiryId, long empId);

    void createAnswerDraft(long inquiryId, long empId, String answer);

    void updateAnswerDraft(long inquiryId, long empId, String answer);

    void sendAnswer(long inquiryId, long empId, LocalDateTime sentAt);



}
