package com.haruon.groupware.application.franchise.service.command;

import com.haruon.groupware.application.employee.account.required.EmpRepository;
import com.haruon.groupware.application.file.required.FileStorage;
import com.haruon.groupware.application.file.service.command.dto.FilePathInfo;
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

import java.util.List;

import static com.haruon.groupware.application.franchise.service.support.FranchiseUtils.*;

@Service
@Transactional
@RequiredArgsConstructor
public class EducationService implements EducationManagement {

    private final EmpRepository empRepository;
    private final EducationRepository educationRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;
    private final FileStorage fileStorage;

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

        Education saved = educationRepository.save(education);

        saved.generateEducationCode(
                String.format(
                        "EDU-%04d%02d-%04d",
                        saved.getEducationDate().getYear(),
                        saved.getEducationDate().getMonthValue(),
                        saved.getId()
                )
        );

        return saved.getId();
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

    @Override
    public void delete(Long educationId, Long empId) {
        Education education = findEducation(educationRepository, educationId);
        validateRegister(empRepository, authorizationQueryRepository, education, empId);

        List<FilePathInfo> files = education.getEducationFiles().stream()
                .map(file -> new FilePathInfo(file.getStoredPath(), file.getStoredName()))
                .toList();

        educationRepository.delete(education);

        files.forEach(file -> fileStorage.delete(file.storedPath(), file.storedName()));
    }

}
