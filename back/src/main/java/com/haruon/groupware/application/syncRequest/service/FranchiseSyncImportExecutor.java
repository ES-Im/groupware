package com.haruon.groupware.application.syncRequest.service;

import com.haruon.groupware.application.franchise.provided.forImport.EducationApplicationImporter;
import com.haruon.groupware.application.franchise.provided.forImport.FranchiseDailySalesImporter;
import com.haruon.groupware.application.franchise.provided.forImport.InquiryImporter;
import com.haruon.groupware.application.franchise.service.command.dto.ApplicationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.CancellationRequest;
import com.haruon.groupware.application.franchise.service.command.dto.DailySalesRequest;
import com.haruon.groupware.application.franchise.service.command.dto.InquiryRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FranchiseSyncImportExecutor {

    private final FranchiseDailySalesImporter dailySalesImporter;
    private final EducationApplicationImporter educationApplicationImporter;
    private final InquiryImporter inquiryImporter;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void importDailySales(long franchiseId, DailySalesRequest request) {
        dailySalesImporter.importDailySales(franchiseId, request);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void importInquiry(long franchiseId, InquiryRequest request) {
        inquiryImporter.importInquiry(franchiseId, request);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void importEducationApplication(ApplicationRequest request) {
        educationApplicationImporter.importEducationApplication(request.educationId(), request);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void importEducationCancellation(CancellationRequest request) {
        educationApplicationImporter.cancelEducationApplication(request.educationId(), request);
    }
}
