package com.haruon.groupware.application.draft.provided.forCommand;

import com.haruon.groupware.application.draft.service.command.dto.createDraft.SalesDraftCreateRequest;
import com.haruon.groupware.application.draft.service.command.dto.updateDraft.SalesDraftUpdateRequest;

import java.time.LocalDateTime;

/**
 * 매출보고 기안서 전용 command port
 */
public interface SalesDraftManagement {

    Long createDraft(Long drafterEmpId, SalesDraftCreateRequest request);

    Long createSubmitted(Long drafterEmpId, SalesDraftCreateRequest request);

    void updateDraft(Long drafterEmpId, Long draftId, SalesDraftUpdateRequest request);

    void approve(long draftId, long approverId, LocalDateTime approvedAt);
}
