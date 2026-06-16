package com.haruon.groupware.application.franchise.service.query.dto.education;

import com.haruon.groupware.application.file.dto.response.FileListInfo;
import org.jspecify.annotations.Nullable;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    public EducationDetailResponse(
            EducationDetailInfo info,
            @Nullable List<FileListInfo> files
    ) {
        this(
                info.id, info.date, info.startAt, info.place, info.title, info.content,
                info.appliedCount, info.capacity, info.remainingCapacity, info.isActive,
                files
        );
    }

    public record EducationDetailInfo(
            Long id,
            LocalDate date,
            LocalTime startAt,
            String place,
            String title,
            String content,
            Long appliedCount,
            Long capacity,
            Long remainingCapacity,
            Boolean isActive
    ) {
        public EducationDetailInfo(
                Long id,
                LocalDateTime educationDate,
                LocalDateTime educationStartAt,
                String place,
                String title,
                String content,
                Long appliedCount,
                Long capacity,
                Long remainingCapacity,
                Boolean isActive
        ) {
            this(
                    id, educationDate.toLocalDate(), educationStartAt.toLocalTime(), place, title, content,
                    appliedCount, capacity, remainingCapacity, isActive
            );
        }
    }
}
