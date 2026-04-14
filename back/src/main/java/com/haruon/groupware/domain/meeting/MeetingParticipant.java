package com.haruon.groupware.domain.meeting;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MeetingParticipant extends AbstractEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="participant_id", nullable = false)
    private Emp emp;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="revervation_id", nullable = false)
    private Meeting meeting;

    static MeetingParticipant create(Meeting meeting, Emp emp) {
        MeetingParticipant meetingParticipant = new MeetingParticipant();

        meetingParticipant.emp = emp;
        meetingParticipant.meeting = meeting;

        return meetingParticipant;
    }


}