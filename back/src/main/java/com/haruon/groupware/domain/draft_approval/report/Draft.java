package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@DiscriminatorColumn(name = "draft_type")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
public abstract class Draft extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "drafter_id", nullable = false)
    private Emp emp;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String content;

    private LocalDateTime submittedAt;

    @OneToMany(mappedBy = "draft", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DraftFile> draftFiles = new ArrayList<>();

    @OneToOne(mappedBy = "draft", cascade = CascadeType.ALL, orphanRemoval = true)
    private Approval approval;

    @OneToMany(mappedBy = "draft", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Circulation> circulations = new ArrayList<>();

    protected Draft(String title, String content, Emp emp) {
        requireNonNull(title);
        requireNonNull(content);
        requireNonNull(emp);
        
        state(!title.isBlank(), "제목은 빈값이 될 수 없음");
        state(!content.isBlank(), "내용은 빈값이 될 수 없음");
        
        this.title = title;
        this.content = content;
        this.emp = emp;

    }

    public void revertToDraft() {
        this.approval.revertToDraft();

        this.submittedAt = null;
    }

//    APPROVAL 공통 메서드
    public void createDraftApproval(List<ApproversParam> params) {
        state(!hasApproval(), "결재 정보가 이미 있음");

        this.approval = Approval.createDraft(this, params);
    }

    public void createSubmittedApproval(List<ApproversParam> params, LocalDateTime submittedAt) {
        state(!hasApproval(), "결재 정보가 이미 있음");
        requireNonNull(submittedAt);

        this.approval = Approval.createSubmitted(this, params);
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

    public void submit(LocalDateTime submittedAt) {
        state(hasApproval(), "결재 정보가 없음");

        this.approval.submit();
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
        state(this.isReadableByCirculation(), "공람가능한 상태가 아님");
        requireNonNull(emp);
        requireNonNull(readAt);

        Circulation circulation = getCirculationByEmp(emp);

        circulation.markRead(readAt);
    }

    public boolean isReadableByCirculation() {
        return this.approval.isApproved();
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
        DraftFile file = DraftFile.create(
                this, mimeType, originalName, extension, fileSize
        );

        this.draftFiles.add(file);
    }

    public void removeFile(DraftFile file) {
        requireNonNull(file, "file은 null일 수 없음");

        boolean removed = this.draftFiles.remove(file);
        state(removed, "해당 파일이 없음");
    }
}
