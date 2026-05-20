package com.haruon.groupware.domain.franchise;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor( access = AccessLevel.PROTECTED)
@ToString(callSuper = true, exclude = {"emp", "educationFiles", "educationApplications"})
public class Education extends AbstractEntity {

    private Emp emp;

    private LocalDateTime educationDate;

    private String place;

    private String title;

    private String content;

    private long capacity;

    private boolean isActive;

    private List<EducationFile> educationFiles = new ArrayList<>();

    private List<EducationApplication> educationApplications = new ArrayList<>();

    public static Education create(
        Emp emp,
        LocalDateTime educationDate,
        String place,
        String title,
        String content,
        Long capacity
    ) {
        state(capacity > 0, "수용인원은 0보다 커야함");

        Education education = new Education();

        education.emp = requireNonNull(emp);
        education.educationDate = requireNonNull(educationDate);
        education.place = requireNonNull(place);
        education.title = requireNonNull(title);
        education.content = requireNonNull(content);
        education.capacity = requireNonNull(capacity);
        education.isActive = false;

        return education;
    }

    public void changeEducationInfo(
            @Nullable LocalDateTime educationDate,
            @Nullable String place,
            @Nullable String title,
            @Nullable String content,
            @Nullable Long capacity
    ) {
        state(isChangeable(educationDate, place, title, content, capacity), "변경할 내용이 없음");
        state(!this.isActive, "교육 비활성화 상태에서만 수정 가능");

        LocalDateTime editedEducationDate = educationDate != null ? educationDate : this.educationDate;
        String editedPlace = place != null ? place : this.place;
        String editedTitle = title != null ? title : this.title;
        String editedContent = content != null ? content : this.content;
        long editedCapacity = capacity != null ? capacity : this.capacity;

        this.educationDate = requireNonNull(editedEducationDate);
        this.place = requireNonNull(editedPlace);
        this.title = requireNonNull(editedTitle);
        this.content = requireNonNull(editedContent);
        this.capacity = editedCapacity;

        state(editedCapacity > 0, "수용인원은 0보다 커야함");
    }

    public void activate() {
        this.isActive = true;
    }

    public void deactivate() {
        state(educationApplications.isEmpty(), "교육 참가 신청이 없을 때만 비활성화 가능");
        this.isActive = false;
    }


    public void applyByFranchise(
            String externalId,
            Franchise franchise,
            Long appliedCount,
            LocalDateTime appliedAt
    ) {
        state(this.isActive, "활성화된 교육에만 신청 가능");
        validateAppliedCount(appliedCount, 0);

        this.educationApplications.add(
                EducationApplication.create(
                        externalId, this, franchise, appliedCount, appliedAt
                )
        );
    }

    public void replaceApplication (
            String externalId,
            Franchise franchise,
            Long appliedCount,
            LocalDateTime appliedAt
    ) {
        requireNonNull(externalId);
        requireNonNull(appliedCount);
        requireNonNull(appliedAt);

        EducationApplication targetApplication = this.educationApplications.stream()
                .filter(application -> application.getExternalId().equals(externalId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("해당 신청정보가 없음"));

        state(targetApplication.getFranchise().equals(franchise), "신청정보가 잘못됨(같은 가맹점이 아님)");
        validateAppliedCount(appliedCount, targetApplication.getAppliedCount());

        targetApplication.replace( appliedCount, appliedAt);
    }

    public void cancelApplication(String externalId, Franchise franchise) {
        requireNonNull(externalId);

        EducationApplication targetApplication = this.educationApplications.stream()
                .filter(application -> application.getExternalId().equals(externalId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("해당 신청정보가 없음"));
        state(targetApplication.getFranchise().equals(franchise), "신청정보가 잘못됨(같은 가맹점이 아님)");

        this.educationApplications.remove(targetApplication);
    }

    public void addEducationFile(
            String mimeType,
            String originalName,
            String extension,
            long fileSize
    ) {
        EducationFile educationFile = EducationFile.create(
                this, mimeType, originalName, extension, fileSize
        );

        this.educationFiles.add(educationFile);
    }

    public void removeEducationFile(Long fileId) {
        EducationFile targetFile = findEducationFileById(fileId);

        this.educationFiles.remove(targetFile);
    }

    private long getAppliedCount() {
        long alreadyAppliedCount = 0;

        for (EducationApplication application : this.educationApplications) {
            alreadyAppliedCount += application.getAppliedCount();
        }

        return alreadyAppliedCount;
    }

    private void validateAppliedCount(Long newAppliedCount, long previousAppliedCount) {
        state(newAppliedCount > 0, "신청인원은 양수여야 한다.");

        long expectedTotalAppliedCount =
                getAppliedCount() - previousAppliedCount + newAppliedCount;

        state(expectedTotalAppliedCount <= this.capacity, "수용인원을 초과하여 신청 불가");
    }

    private boolean isChangeable(
            @Nullable LocalDateTime educationDate,
            @Nullable String place,
            @Nullable String title,
            @Nullable String content,
            @Nullable Long capacity
    ) {
        return educationDate != null || place != null || title != null || content != null || capacity != null;
    }

    private EducationFile findEducationFileById(Long fileId) {
        return this.getEducationFiles().stream()
                .filter(f -> f.getId().equals(fileId))
                .findFirst().orElseThrow(() -> new IllegalStateException("조회된 파일이 없음"));
    }

}
