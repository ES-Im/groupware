package com.haruon.groupware.application.meeting.required;

import com.haruon.groupware.domain.meeting.MeetingRoom;
import org.springframework.data.repository.Repository;

import java.util.Optional;

public interface MeetingRoomRepository extends Repository<MeetingRoom, Long>  {

    Optional<MeetingRoom> findById(long roomId);

    MeetingRoom save(MeetingRoom room);
}
