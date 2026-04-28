package com.haruon.groupware.application.franchise.provided;

import com.haruon.groupware.application.franchise.service.dto.EducationCreateRequest;
import com.haruon.groupware.application.franchise.service.dto.EducationFileCreateRequest;
import com.haruon.groupware.application.franchise.service.dto.EducationUpdateRequest;

/**
 * 가맹점 교육 생성/수정/관리
 */
public interface EducationManagement {

    void createEducation(long managerId, EducationCreateRequest request);

    void updateEducation(long educationId, long managerId, EducationUpdateRequest request);

    void activate(long educationId, long managerId);

    void deactivate(long educationId, long managerId);

    void addEducationFile(long educationId, long managerId, EducationFileCreateRequest request);

    void removeEducationFile(long educationId, long managerId, long fileId);

}
