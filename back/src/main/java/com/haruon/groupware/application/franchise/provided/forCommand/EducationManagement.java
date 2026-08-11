package com.haruon.groupware.application.franchise.provided.forCommand;

import com.haruon.groupware.application.franchise.service.command.dto.EducationCreateRequest;
import com.haruon.groupware.application.franchise.service.command.dto.EducationUpdateRequest;

/**
 * 가맹점 교육 생성/수정/관리
 */
public interface EducationManagement {

    long createEducation(long managerId, EducationCreateRequest request);

    void updateEducation(long educationId, long managerId, EducationUpdateRequest request);

    void activate(long educationId, long managerId);

    void deactivate(long educationId, long managerId);

    void delete(Long educationId, Long empId);
}
