package com.haruon.groupware.domain.draft_approval.report;

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
@Getter
@DiscriminatorValue("BUSINESS_TRIP")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BusinessTripDraft extends Draft {

    @Column(nullable = false)
    private LocalDateTime startAt;

    @Column(nullable = false)
    private LocalDateTime endAt;

    @Column(nullable = false)
    private String destination;

    @Column(nullable = false)
    private String purpose;

    @OneToMany(mappedBy = "businessTripDraft", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BusinessTripParticipant> participants = new ArrayList<>();

    private BusinessTripDraft(String title, String content, Emp emp) {
        super(title, content, emp);
    }

    public static BusinessTripDraft createDraft(
            Emp emp,
            String title,
            String content,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String destination,
            String purpose,
            List<Emp> participants,
            List<ApproversParam> approvers
    ) {
        BusinessTripDraft draft = new BusinessTripDraft(title, content, emp);

        draft.init(startAt, endAt, destination, purpose, participants);
        draft.createDraftApproval(approvers);

        return draft;
    }

    public static BusinessTripDraft createSubmitted(
            Emp emp,
            String title,
            String content,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String destination,
            String purpose,
            List<Emp> participants,
            List<ApproversParam> approvers,
            LocalDateTime submittedAt
    ) {
        BusinessTripDraft draft = new BusinessTripDraft(title, content, emp);

        draft.init(startAt, endAt, destination, purpose, participants);
        draft.createSubmittedApproval(approvers, submittedAt);

        return draft;
    }


    private void init(
            LocalDateTime startAt,
            LocalDateTime endAt,
            String destination,
            String purpose,
            List<Emp> participants
    ) {
        requireNonNull(startAt, "출장 시작일시는 null일 수 없음");
        requireNonNull(endAt, "출장 종료일시는 null일 수 없음");
        requireNonNull(destination, "목적지는 null일 수 없음");
        requireNonNull(purpose, "출장목적은 null일 수 없음");

        state(!endAt.isBefore(startAt), "종료시간은 시작시간보다 이를 수 없음");
        state(!destination.isBlank(), "목적지는 빈 값이 될 수 없음");
        state(!purpose.isBlank(), "출장목적은 빈 값이 될 수 없음");

        this.startAt = startAt;
        this.endAt = endAt;
        this.destination = destination;
        this.purpose = purpose;

        if (participants != null) {
            participants.forEach(this::addParticipant);
        }
    }

    public void addParticipant(Emp emp) {
        requireNonNull(emp, "참여자는 null일 수 없음");
        state(!hasParticipant(emp), "이미 등록된 참여자");

        BusinessTripParticipant participant = BusinessTripParticipant.create(this, emp);
        this.participants.add(participant);
    }

    public void removeParticipant(Emp emp) {
        requireNonNull(emp, "참여자는 null일 수 없음");

        BusinessTripParticipant participant = getBusinessTripParticipant(emp);
        this.participants.remove(participant);
    }

    private BusinessTripParticipant getBusinessTripParticipant(Emp emp) {
        return this.participants.stream()
                .filter(p -> p.getEmp().getId().equals(emp.getId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당 참여자가 없음"));
    }

    private boolean hasParticipant(Emp emp) {
        return this.participants.stream()
                .anyMatch(e -> e.getEmp().getId().equals(emp.getId()));
    }

}
