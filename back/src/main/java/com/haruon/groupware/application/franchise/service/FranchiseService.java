package com.haruon.groupware.application.franchise.service;

import com.haruon.groupware.application.empInfo.required.EmpRepository;
import com.haruon.groupware.application.franchise.provided.FranchiseManagement;
import com.haruon.groupware.application.franchise.required.FranchiseRepository;
import com.haruon.groupware.application.franchise.service.dto.FranchiseCreateRequest;
import com.haruon.groupware.application.franchise.service.dto.FranchiseUpdateRequest;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.franchise.BusinessStatus;
import com.haruon.groupware.domain.franchise.Franchise;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import static com.haruon.groupware.application.franchise.service.FranchiseUtils.findFranchiseById;
import static com.haruon.groupware.application.franchise.service.FranchiseUtils.getFranchiseRoleAssignedEmp;
import static com.haruon.groupware.application.utils.AuthorizationChecker.checkFranchiseRoleEmp;

@Service
@Transactional
@RequiredArgsConstructor
public class FranchiseService implements FranchiseManagement {

    private final FranchiseRepository franchiseRepository;
    private final EmpRepository empRepository;

    @Override
    public long createFranchise(long franchiseRegisterId, FranchiseCreateRequest request) {
        Emp manager = determineManager(franchiseRegisterId, request.managerEmpId());

        Franchise franchise = Franchise.create(
                request.businessNumber(),
                request.franchiseName(),
                request.address(),
                request.ownerName(),
                request.contactNumber(),
                request.contactEmail(),
                manager
        );

        return franchiseRepository.save(franchise).getId();
    }

    @Override
    public void updateFranchise(long franchiseId, long updaterId, FranchiseUpdateRequest request) {
        checkFranchiseRoleEmp(empRepository, updaterId);
        Franchise franchise = findFranchiseById(franchiseRepository, franchiseId);

        franchise.changeFranchiseInfo(
                request.businessNumber(),
                request.franchiseName(),
                request.address(),
                request.ownerName(),
                request.contactNumber(),
                request.contactEmail()
        );
    }



    @Override
    public void changeFranchiseStatus(long franchiseId, long updaterId, BusinessStatus status) {
        checkFranchiseRoleEmp(empRepository, updaterId);
        Franchise franchise = findFranchiseById(franchiseRepository, franchiseId);

        franchise.changeBusinessStatus(status);
    }

    @Override
    public void changeManager(long franchiseId, long updaterId, long newManagerId) {
        checkFranchiseRoleEmp(empRepository, updaterId);
        Franchise franchise = findFranchiseById(franchiseRepository, franchiseId);

        Emp newManager = getFranchiseRoleAssignedEmp(empRepository, newManagerId);

        franchise.changeManager(newManager);
    }

    @Override
    public void changeMemo(long franchiseId, long updaterId, String memo) {
        checkFranchiseRoleEmp(empRepository, updaterId);
        Franchise franchise = findFranchiseById(franchiseRepository, franchiseId);

        franchise.changeMemo(memo);
    }

    @Override
    public void clearMemo(long franchiseId, long updaterId) {
        checkFranchiseRoleEmp(empRepository, updaterId);
        Franchise franchise = findFranchiseById(franchiseRepository, franchiseId);

        franchise.clearMemo();
    }


    private @Nullable Emp determineManager(long franchiseRegisterId, @Nullable Long managerId) {
        Emp manager = null;

        if(managerId != null) {
            boolean registerEqualsManager = managerId.equals(franchiseRegisterId);

            if(registerEqualsManager) {
                manager = getFranchiseRoleAssignedEmp(empRepository, franchiseRegisterId);
            } else {
                manager = getFranchiseRoleAssignedEmp(empRepository, managerId);
            }

        }

        if(managerId == null) {
            checkFranchiseRoleEmp(empRepository, franchiseRegisterId);
        }

        return manager;
    }
}
