package com.haruon.groupware.application.franchise.service.query.dto.education;

import com.haruon.groupware.application.file.dto.response.FileListInfo;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record EducationDetailResponse(
        Long id,
        LocalDate date,
        LocalTime startAt,
        String place,
        String title,
        String content,
        Long appliedCount,
        Long capacity,
        Long remainingCapacity,
        Boolean isActive,
        @Nullable List<FileListInfo> fileListInfoList
) {
}
