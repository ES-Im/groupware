package com.haruon.groupware.domain.draft;

import com.haruon.groupware.domain.draft.sub.ApproversParam;
import com.haruon.groupware.domain.empInfo.Emp;
import com.haruon.groupware.domain.event.byBusinessTripApprove.BusinessTripApprovedEvent;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;
import org.jspecify.annotations.Nullable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import static java.util.Objects.requireNonNull;
import static java.util.stream.Collectors.toSet;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(callSuper = true, exclude = "participants")
public class BusinessTripDraft extends Draft {

    private LocalDateTime startAt;

    private LocalDateTime endAt;

    private String destination;

    private String purpose;

    private List<BusinessTripParticipant> participants = new ArrayList<>();


    private BusinessTripDraft(String title, String content, Emp emp) {
        super(title, content, emp);
    }

    private void init (
            LocalDateTime startAt,
            LocalDateTime endAt,
            String destination,
            String purpose,
            @Nullable List<Emp> participants
    ) {
        validateBusinessTripInitParam(startAt, endAt, destination, purpose);

        this.startAt = startAt;
        this.endAt = endAt;
        this.destination = destination;
        this.purpose = purpose;

        if (participants!= null && !participants.isEmpty()) {
            participants.forEach(this::addParticipant);
        }
    }

    public static BusinessTripDraft createDraft (
            Emp emp,
            String title,
            String content,
            LocalDateTime startAt,
            LocalDateTime endAt,
            String destination,
            String purpose,
            @Nullable List<Emp> participants,
            @Nullable List<ApproversParam> approvers
    ) {
        BusinessTripDraft draft = new BusinessTripDraft(title, content, emp);
        draft.init(startAt, endAt, destination, purpose, participants);
        draft.createDraftApproval(approvers);

        return draft;
    }

    public static BusinessTripDraft createSubmitted (
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
        BusinessTripDraft submitted = new BusinessTripDraft(title, content, emp);

        submitted.init(startAt, endAt, destination, purpose, participants);
        submitted.createSubmittedApproval(approvers, submittedAt);

        return submitted;
    }

    public void editBusinessTripDraft (
            @Nullable String title,
            @Nullable String content,
            @Nullable LocalDateTime startAt,
            @Nullable LocalDateTime endAt,
            @Nullable String destination,
            @Nullable String purpose
    ) {
        editDraft(title, content);

        LocalDateTime editedStartAt = startAt != null ? startAt : this.startAt;
        LocalDateTime editedEndAt = endAt != null ? endAt : this.endAt;
        String editedDestination = destination != null ? destination : this.destination;
        String editedPurpose = purpose != null ? purpose : this.purpose;

        validateBusinessTripInitParam(editedStartAt, editedEndAt, editedDestination, editedPurpose);

        this.startAt = editedStartAt;
        this.endAt = editedEndAt;
        this.destination = editedDestination;
        this.purpose = editedPurpose;
    }

    @Override
    public void approve(Emp approver, LocalDateTime approvedAt) {
        super.approve(approver, approvedAt);
        boolean hasAllApproved = this.hasAllApproved();

        if(hasAllApproved) {
            publishBusinessTripApprovedEvent(this);
        }
    }

    public void changeParticipants(List<Emp> newParticipants) {
        state(isDraft(), "미상신 문서만 수정가능");
        requireNonNull(newParticipants, "참여자 목록은 null일 수 없음");
        state(!newParticipants.isEmpty(), "참여자 목록은 비어 있을 수 없음");

        Set<Emp> newParticipantSet = new LinkedHashSet<>(newParticipants);
        Set<Emp> currentEmpSet = this.participants.stream()
                .map(BusinessTripParticipant::getEmp)
                .collect(toSet());

        List<BusinessTripParticipant> removeTargets = this.participants.stream()
                .filter(mp -> !newParticipantSet.contains(mp.getEmp())).toList();
        List<Emp> addTargets = newParticipantSet.stream()
                .filter(emp -> !currentEmpSet.contains(emp)).toList();
        if (removeTargets.isEmpty() && addTargets.isEmpty()) return;

        for (BusinessTripParticipant removeTarget : removeTargets) this.participants.remove(removeTarget);

        for (Emp emp : addTargets) this.participants.add(BusinessTripParticipant.create(this, emp));
    }


    private static void validateBusinessTripInitParam(LocalDateTime startAt, LocalDateTime endAt, String destination, String purpose) {
        requireNonNull(startAt, "출장 시작일시는 null일 수 없음");
        requireNonNull(endAt, "출장 종료일시는 null일 수 없음");
        requireNonNull(destination, "목적지는 null일 수 없음");
        requireNonNull(purpose, "출장목적은 null일 수 없음");

        state(!endAt.isBefore(startAt), "종료시간은 시작시간보다 이를 수 없음");
        state(!destination.isBlank(), "목적지는 빈 값이 될 수 없음");
        state(!purpose.isBlank(), "출장목적은 빈 값이 될 수 없음");
    }

    @Override
    protected void validateBeforeSubmit(@Nullable List<ApproversParam> params) {
        state(!participants.isEmpty(), "참가자가 0명이 될 수 없다.");

        super.validateBeforeSubmit(params);
    }

    private void addParticipant(Emp emp) {
        state(isDraft(), "미상신 문서만 수정가능");

        boolean alreadyEnrolled = this.participants.stream()
                .anyMatch(e -> e.getEmp().equals(emp));
        state(!alreadyEnrolled, "이미 등록된 참여자");

        BusinessTripParticipant participant = BusinessTripParticipant.create(this, emp);
        this.participants.add(participant);
    }

    private static void publishBusinessTripApprovedEvent(BusinessTripDraft submitted) {
        submitted.registerEvent(
                BusinessTripApprovedEvent.builder()
                        .sourceKey(submitted.sourceKey)
                        .drafterEmpId(submitted.emp.getId())
                        .title(submitted.title)
                        .content(submitted.content)
                        .startAt(submitted.startAt)
                        .endAt(submitted.endAt)
                        .destination(submitted.destination)
                        .purpose(submitted.purpose)
                        .participantsId(submitted.participants.stream()
                                .map(p -> p.getEmp().getId())
                                .toList()
                        )
                .build()
        );
    }



}

