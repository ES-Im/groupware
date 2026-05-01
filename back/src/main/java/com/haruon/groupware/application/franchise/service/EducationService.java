package com.haruon.groupware.application.franchise.service;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.franchise.provided.EducationManagement;
import com.haruon.groupware.application.franchise.requried.EducationRepository;
import com.haruon.groupware.application.franchise.service.dto.EducationCreateRequest;
import com.haruon.groupware.application.franchise.service.dto.EducationFileCreateRequest;
import com.haruon.groupware.application.franchise.service.dto.EducationUpdateRequest;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.franchise.Education;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.franchise.service.FranchiseUtils.findEducation;
import static com.haruon.groupware.application.franchise.service.FranchiseUtils.getFranchiseRoleAssignedEmp;

@Service
@Transactional
@RequiredArgsConstructor
public class EducationService implements EducationManagement {

    private final EmpRepository empRepository;
    private final EducationRepository educationRepository;

    @Override
    public long createEducation(long managerId, EducationCreateRequest request) {
        Emp assignedEmp = getFranchiseRoleAssignedEmp(empRepository, managerId);

        Education education = Education.create(
                assignedEmp,
                request.educationDate(),
                request.place(),
                request.title(),
                request.content(),
                request.capacity()
        );

        return educationRepository.save(education).getId();
    }

    @Override
    public void updateEducation(long educationId, long managerId, EducationUpdateRequest request) {
        Education education = findEducation(educationRepository, educationId);
        validateRegister(education, managerId);

        education.changeEducationInfo(
                request.educationDate(),
                request.place(),
                request.title(),
                request.content(),
                request.capacity()
        );
    }

    @Override
    public void activate(long educationId, long managerId) {
        Education education = findEducation(educationRepository, educationId);
        validateRegister(education, managerId);

        education.activate();
    }

    @Override
    public void deactivate(long educationId, long managerId) {
        Education education = findEducation(educationRepository, educationId);
        validateRegister(education, managerId);

        education.deactivate();
    }

    @Override
    public void addEducationFile(long educationId, long managerId, EducationFileCreateRequest request) {
        Education education = findEducation(educationRepository, educationId);
        validateRegister(education, managerId);

        education.addEducationFile(
                request.file().mimeType(),
                request.file().originalFileName(),
                request.file().extension(),
                request.file().fileSize()
        );
    }

    @Override
    public void removeEducationFile(long educationId, long managerId, long fileId) {
        Education education = findEducation(educationRepository, educationId);
        validateRegister(education, managerId);

        education.removeEducationFile(fileId);
    }

    private void validateRegister(Education education, long managerId) {
        Emp assignedEmp = getFranchiseRoleAssignedEmp(empRepository, managerId);

        if(!education.getEmp().equals(assignedEmp))
            throw new IllegalStateException("교육 등록자와 불일치"); // to-do 커스텀 예외처리
    }
}
