package com.haruon.groupware.application.franchise.provided;

import com.haruon.groupware.application.franchise.service.dto.InquiryRequest;

/**
 * 메시지 어댑터로 받은 가맹점 질의 데이터를 저장/수정하는 Port
 */
public interface InquiryImporter {

    long importInquiry(long franchiseId, InquiryRequest request);

}
