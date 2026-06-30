package com.haruon.groupware.application.syncRequest.service.dto;

import com.haruon.groupware.domain.sync.FranchiseSyncTask;

public record FranchiseSyncCommand<T>(
        FranchiseSyncTask syncTask,
        long franchiseId,
        T request   // application.franchise.provided.forImport Request DTO
) {
}
