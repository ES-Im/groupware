package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.event.AbstractEventAggregateRoot;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "draft_type")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public abstract class Draft extends AbstractEventAggregateRoot {

    @Column(unique = true, nullable = false, updatable = false)
    protected String sourceKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drafter_id", nullable = false)
    protected Emp emp;

    @Column(nullable = false)
    protected String title;

    @Column(nullable = false)
    protected String content;

    @Nullable
    protected LocalDateTime submittedAt;

    @OneToMany(mappedBy = "draft", cascade = CascadeType.ALL, orphanRemoval = true)
    protected List<DraftFile> draftFiles = new ArrayList<>();

    @Nullable
    @OneToOne(mappedBy = "draft", cascade = CascadeType.ALL, orphanRemoval = true)
    protected Approval approval;

    @OneToMany(mappedBy = "draft", cascade = CascadeType.ALL, orphanRemoval = true)
    protected List<Circulation> circulations = new ArrayList<>();

// Draft 기안관련 공통 메서드

    public void revertToDraft() {
        requireNonNull(this.approval);
        this.approval.revertToDraft();

        this.submittedAt = null;
    }

    protected Draft(String title, String content, Emp emp) {
        requireNonNull(emp);
        validateDraftBase(title, content);

        this.title = title;
        this.content = content;
        this.emp = emp;
        this.sourceKey = UUID.randomUUID().toString();

    }

    protected void editDraft(
            @Nullable String title,
            @Nullable String content
    ) {
        state(isDraft(), "미상신 문서만 수정가능");

        String editedTitle = title != null ? title : this.title;
        String editedContent = content != null ? content : this.content;

        validateDraftBase(editedTitle, editedContent);

        this.title = editedTitle;
        this.content = editedContent;
    }

    protected static void validateDraftBase(String title, String content) {
        requireNonNull(title, "제목은 null일 수 없음");
        requireNonNull(content, "내용은 null일 수 없음");

        state(!title.isBlank(), "제목은 빈값이 될 수 없음");
        state(!content.isBlank(), "내용은 빈값이 될 수 없음");
    }


    public static void validateTime(LocalDateTime startAt, LocalDateTime endAt) {
        state(!endAt.isBefore(startAt), "종료시간은 시작시간보다 이를 수 없음");

        state(startAt.getMinute() == 0 && startAt.getSecond() == 0 && startAt.getNano() == 0,
                "휴가 시작시각은 정각이어야 한다.");
        state(endAt.getMinute() == 0 && endAt.getSecond() == 0 && endAt.getNano() == 0,
                "휴가 종료시각은 정각이어야 한다.");
    }

//    APPROVAL 공통 메서드

    public void submit(LocalDateTime submittedAt, @Nullable List<ApproversParam> params) {
        requireNonNull(submittedAt, "상신일시는 null일 수 없음");
        state(hasApproval(), "결재 정보가 없음");

        validateBeforeSubmit(params);
        this.approval.submit(params);
        this.submittedAt = submittedAt;
    }

    public void approve(Emp approver, LocalDateTime approvedAt) {
        state(hasApproval(), "결재 정보가 없음");
        this.approval.approve(approver, approvedAt);
    }

    public void reject(Emp rejector, String reason, LocalDateTime rejectedAt) {
        state(hasApproval(), "결재 정보가 없음");

        this.approval.reject(rejector, reason, rejectedAt);
    }

    protected void createDraftApproval(@Nullable List<ApproversParam> params) {
        state(!hasApproval(), "결재 정보가 이미 있음");
        this.approval = Approval.createDraft(this, params);
    }

    protected void createSubmittedApproval(List<ApproversParam> params, LocalDateTime submittedAt) {
        requireNonNull(submittedAt, "상신일시는 null일 수 없음");
        state(!hasApproval(), "결재 정보가 이미 있음");

        validateBeforeSubmit(params);
        this.approval = Approval.createSubmitted(this, params);
        this.submittedAt = submittedAt;
    }

    private boolean hasApproval() {
        return this.approval != null;
    }

//    Circulation 공통 메서드
    public void addCirculation(Emp emp) {
        requireNonNull(emp, "공람자가 없음");
        state(!hasCirculation(emp), "이미 공람된 사원");

        Circulation circulation = Circulation.create(this, emp);
        this.circulations.add(circulation);
    }

    public void removeCirculation(Emp emp) {
        requireNonNull(emp, "삭제할 공람자가 없음");
        Circulation circulation = getCirculationByEmp(emp);

        this.circulations.remove(circulation);
    }

    public void markReadByCirculation(Emp emp, LocalDateTime readAt) {
        state(this.hasAllApproved(), "공람가능한 상태가 아님");
        requireNonNull(emp);
        requireNonNull(readAt);

        Circulation circulation = getCirculationByEmp(emp);

        circulation.markRead(readAt);
    }

    protected boolean hasAllApproved() {
        return this.approval!=null && this.approval.isApproved();
    }

    private Circulation getCirculationByEmp(Emp emp) {
        return this.circulations.stream()
                .filter(c -> c.getEmp().equals(emp))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당 공람자가 없음"));
    }

    private boolean hasCirculation(Emp emp) {
        return this.circulations.stream()
                .anyMatch(c -> c.getEmp().equals(emp));
    }

//    DraftFile 공통 메서드
    public void addFile(
            String mimeType,
            String originalName,
            String extension,
            Long fileSize
    ) {
        state(isDraft(), "첨부파일수정가능 상태(UNSUBMITTED)가 아님");

        DraftFile file = DraftFile.create(
                this, mimeType, originalName, extension, fileSize
        );

        this.draftFiles.add(file);
    }

    public void removeFile(long fileId) {
        state(isDraft(), "첨부파일수정가능 상태(UNSUBMITTED)가 아님");

        DraftFile file = this.draftFiles.stream()
                .filter(f -> f.getId().equals(fileId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당 파일이 없음"));

        this.draftFiles.remove(file);
    }

    protected void validateBeforeSubmit(@Nullable List<ApproversParam> params) {}

    protected boolean isDraft() {
        return this.approval == null || this.approval.isDraft();
    }
}
