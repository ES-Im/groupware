package com.haruon.groupware.domain.draft_approval.report;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

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

    @Column(nullable = false)
    private boolean isTemporary;

    @OneToMany(mappedBy = "draft", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DraftFile> draftFiles = new ArrayList<>();

    @OneToOne(mappedBy = "draft", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Approval approval;

    @OneToMany(mappedBy = "draft", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ApprovalReference> references = new ArrayList<>();

    protected Draft(
            Emp emp,
            String title,
            String content,
            boolean isTemporary
    ) {
        this.emp = requireNonNull(emp);
        this.title = requireNonNull(title);
        this.content = requireNonNull(content);
        this.isTemporary = isTemporary;
    }

    public void submit(List<Emp> approvers, List<Emp> cooperationEmps) {
        state(this.isTemporary, "이미 상신된 기안서는 다시 상신할 수 없음");
        state(this.approval == null, "이미 결재 정보가 존재함");

        this.approval = Approval.create(this, approvers, cooperationEmps);
        this.isTemporary = false;
    }

    public void addReference(Emp emp) {
        requireNonNull(emp, "공람자가 없음");

        ApprovalReference reference = ApprovalReference.create(this, emp);
        this.references.add(reference);
    }

    public void removeReference(Long referenceId) {
        requireNonNull(referenceId, "삭제할 공람자가 없음");

        ApprovalReference target = this.references.stream()
                .filter(ref -> ref.getId().equals(referenceId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("삭제할 공람자가 없음"));

        this.references.remove(target);
    }

    public void addFile(
            String mimeType,
            String originalName,
            String extension,
            Long fileSize
    ) {
        DraftFile file = DraftFile.create(this, mimeType, originalName, extension, fileSize);
        this.draftFiles.add(file);
    }

    public boolean canBeReadByReference() {
        return this.approval != null && this.approval.isApproved();
    }

}
