package com.haruon.groupware.domain.meetingroom;

import com.haruon.groupware.domain.AbstractFileEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;

@Entity
public class MeetingRoomFile extends AbstractFileEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="room_id", nullable = false)
    private MeetingRoom meetingRoom;

}
