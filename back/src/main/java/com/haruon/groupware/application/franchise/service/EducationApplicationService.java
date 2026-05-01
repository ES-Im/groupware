package com.haruon.groupware.application.franchise.service;

import com.haruon.groupware.application.franchise.provided.EducationApplicationImporter;
import com.haruon.groupware.application.franchise.requried.EducationRepository;
import com.haruon.groupware.application.franchise.requried.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.dto.ApplicationRequest;
import com.haruon.groupware.domain.franchise.Education;
import com.haruon.groupware.domain.franchise.Franchise;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.franchise.service.FranchiseUtils.findEducation;
import static com.haruon.groupware.application.franchise.service.FranchiseUtils.findFranchiseById;

@Service
@Transactional
@RequiredArgsConstructor
public class EducationApplicationService implements EducationApplicationImporter {

    private final EducationRepository educationRepository;
    private final FranchiseRepository franchiseRepository;

    @Override
    public void importEducationApplication(long educationId, ApplicationRequest request) {
        Education education = findEducation(educationRepository, educationId);
        Franchise franchise = findFranchiseById(franchiseRepository, request.franchiseId());

        String externalId = request.externalId();
        boolean isForReplace = hasApplication(education, externalId);

        if(isForReplace) {
            replaceApplication(education, franchise, request);
            return;
        }

        applyByFranchise(education, franchise, request);
    }

    private void applyByFranchise(Education education, Franchise franchise, ApplicationRequest request) {
        education.applyByFranchise(
                request.externalId(),
                franchise,
                request.appliedCount(),
                request.appliedAt()
        );
    }

    private void replaceApplication(Education education, Franchise franchise, ApplicationRequest request) {
        education.replaceApplication(
                request.externalId(),
                franchise,
                request.appliedCount(),
                request.appliedAt()
        );
    }


    @Override
    public void cancelEducationApplication(long educationId, long franchiseId, String externalId) {
        Education education = findEducation(educationRepository, educationId);
        Franchise franchise = findFranchiseById(franchiseRepository, franchiseId);

        education.cancelApplication(externalId, franchise);
    }


    private boolean hasApplication(Education education, String externalId) {
        return education.getEducationApplications().stream()
                .anyMatch(application ->
                        application.getExternalId().equals(externalId)
                );
    }
}
