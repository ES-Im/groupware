package com.haruon.groupware.application.franchise.provided;

import com.haruon.groupware.application.franchise.service.dto.ApplicationRequest;

/**
 * 메시지 어댑터로 받은 교육신청 데이터를 저장/수정하는 Port
 */
public interface EducationApplicationImporter {

    // applyByFranchise 또는 replaceApplication 둘다
    void importEducationApplication(long franchiseId, ApplicationRequest request);

    void cancelEducationApplication(long franchiseId, String externalId);
}
