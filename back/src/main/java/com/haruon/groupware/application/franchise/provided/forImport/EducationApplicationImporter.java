package com.haruon.groupware.application.franchise.provided.forImport;

import com.haruon.groupware.application.franchise.service.command.dto.ApplicationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.CancellationRequest;

/**
 * 메시지 어댑터로 받은 교육신청 데이터를 저장/수정하는 Port
 */
public interface EducationApplicationImporter {

    void importEducationApplication(long educationId, ApplicationRequest request);

    void cancelEducationApplication(long educationId, CancellationRequest request);
}
