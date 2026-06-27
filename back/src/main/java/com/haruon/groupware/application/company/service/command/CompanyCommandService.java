package com.haruon.groupware.application.company.service.command;

import com.haruon.groupware.application.company.provided.forCommand.CompanyManagement;
import com.haruon.groupware.application.company.required.CompanyRepository;
import com.haruon.groupware.application.company.service.command.dto.CompanyContactUpdateRequest;
import com.haruon.groupware.application.company.service.command.dto.CompanyHomePageUpdateRequest;
import com.haruon.groupware.application.company.service.command.dto.CompanyInfoUpdateRequest;
import com.haruon.groupware.application.company.service.command.dto.CompanyRegisterRequest;
import com.haruon.groupware.application.exception.common.RequiredValueMissingException;
import com.haruon.groupware.application.exception.company.CompanyAlreadyExistsException;
import com.haruon.groupware.application.exception.company.CompanyNotFoundException;
import com.haruon.groupware.application.utils.required.AuthorizationQueryRepository;
import com.haruon.groupware.domain.Company;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.utils.AuthValidator.checkAdminById;

@Service
@Transactional
@RequiredArgsConstructor
public class CompanyCommandService implements CompanyManagement {

    private final CompanyRepository companyRepository;
    private final AuthorizationQueryRepository authorizationQueryRepository;

    @Override
    public long registerCompany(Long adminId, CompanyRegisterRequest request) {
        if(request == null) throw new RequiredValueMissingException();
        checkAdminById(authorizationQueryRepository, adminId);

        if(companyRepository.count() > 0) throw new CompanyAlreadyExistsException();

        Company company = Company.register(
                request.companyName(),
                request.location(),
                request.presentedEmail(),
                request.presentedExternalNo(),
                request.ownerName(),
                request.homePageURL(),
                request.editedAt()
        );

        return companyRepository.save(company).getId();
    }

    @Override
    public void updateCompanyInfo(Long adminId, CompanyInfoUpdateRequest request) {
        if(request == null) throw new RequiredValueMissingException();
        checkAdminById(authorizationQueryRepository, adminId);

        Company company = findCurrentCompany();
        Company editedCompany = company.editCompanyInfo(
                request.companyName(),
                request.location(),
                request.ownerName(),
                request.editedAt()
        );

        companyRepository.save(editedCompany);
    }

    @Override
    public void updatePresentedContact(Long adminId, CompanyContactUpdateRequest request) {
        if(request == null) throw new RequiredValueMissingException();
        checkAdminById(authorizationQueryRepository, adminId);

        Company company = findCurrentCompany();
        Company editedCompany = company.editPresentedContact(
                request.presentedEmail(),
                request.presentedExternalNo(),
                request.editedAt()
        );

        companyRepository.save(editedCompany);
    }

    @Override
    public void updateHomePageURL(Long adminId, CompanyHomePageUpdateRequest request) {
        if(request == null) throw new RequiredValueMissingException();
        checkAdminById(authorizationQueryRepository, adminId);

        Company company = findCurrentCompany();
        Company editedCompany = company.editHomePageURL(
                request.homePageURL(),
                request.editedAt()
        );

        companyRepository.save(editedCompany);
    }

    private Company findCurrentCompany() {
        return companyRepository.findFirstByOrderByEditedAtDescIdDesc()
                .orElseThrow(CompanyNotFoundException::new);
    }
}
