package com.haruon.groupware.application.franchise.service.command;

import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.franchise.provided.forCommand.EducationManagement;
import com.haruon.groupware.application.franchise.required.EducationRepository;
import com.haruon.groupware.application.franchise.service.command.dto.EducationCreateRequest;
import com.haruon.groupware.application.franchise.service.command.dto.EducationUpdateRequest;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.employee.Emp;
import com.haruon.groupware.domain.franchise.Education;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.franchise.service.support.FranchiseUtils.*;

@Service
@Transactional
@RequiredArgsConstructor
public class EducationService implements EducationManagement {

    private final EmpRepository empRepository;
    private final EducationRepository educationRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public long createEducation(long managerId, EducationCreateRequest request) {
        Emp assignedEmp = getFranchiseRoleAssignedEmp(empRepository, authorizationQueryRepository, managerId);

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
        validateRegister(empRepository, authorizationQueryRepository, education, managerId);

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
        validateRegister(empRepository, authorizationQueryRepository, education, managerId);

        education.activate();
    }

    @Override
    public void deactivate(long educationId, long managerId) {
        Education education = findEducation(educationRepository, educationId);
        validateRegister(empRepository, authorizationQueryRepository, education, managerId);

        education.deactivate();
    }




}
