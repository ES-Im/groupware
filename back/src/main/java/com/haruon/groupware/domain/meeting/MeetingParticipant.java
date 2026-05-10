package com.haruon.groupware.domain.meeting;

import com.haruon.groupware.domain.AbstractEntity;
import com.haruon.groupware.domain.empInfo.Emp;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MeetingParticipant extends AbstractEntity {

    private Emp emp;

    private Meeting meeting;

    static MeetingParticipant create(Meeting meeting, Emp emp) {
        MeetingParticipant meetingParticipant = new MeetingParticipant();

        meetingParticipant.emp = emp;
        meetingParticipant.meeting = meeting;

        return meetingParticipant;
    }




}