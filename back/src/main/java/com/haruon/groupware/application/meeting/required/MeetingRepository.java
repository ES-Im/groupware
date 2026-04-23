package com.haruon.groupware.application.meeting.required;

import com.haruon.groupware.domain.meeting.Meeting;
import com.haruon.groupware.domain.meeting.MeetingRoom;
import org.springframework.data.repository.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MeetingRepository extends Repository<Meeting, Long> {

    Optional<Meeting> findById(Long id);

    Optional<Meeting> findByIdAndEmpId(long id, long reserverId);

    Meeting save(Meeting reservedMeeting);

    List<Meeting> findMeetingByMeetingDateAfterAndMeetingRoom(LocalDate date, MeetingRoom room);

    Optional<Meeting> findBySourceKey(String sourceKey);
}
