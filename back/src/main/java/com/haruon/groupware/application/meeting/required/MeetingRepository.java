package com.haruon.groupware.application.meeting.required;

import com.haruon.groupware.domain.meeting.Meeting;
import com.haruon.groupware.domain.meeting.MeetingRoom;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface MeetingRepository extends Repository<Meeting, Long> {

    Optional<Meeting> findById(Long id);

    Optional<Meeting> findByIdAndEmpId(long id, long reserverId);

    Meeting save(Meeting reservedMeeting);

    @Query("""
            select count(m) > 0
            from Meeting m
            where m.meetingRoom = :room
              and m.meetingDate = :meetingDate
              and m.isCancel = false
              and m.startAt < :endAt
              and m.endAt > :startAt
            """)
    boolean existsOverlappingReservation(
            @Param("room") MeetingRoom room,
            @Param("meetingDate") LocalDate meetingDate,
            @Param("startAt") LocalTime startAt,
            @Param("endAt") LocalTime endAt
    );

    @Query("""
            select count(m) > 0
            from Meeting m
            where m.id <> :meetingId
              and m.meetingRoom = :room
              and m.meetingDate = :meetingDate
              and m.isCancel = false
              and m.startAt < :endAt
              and m.endAt > :startAt
            """)
    boolean existsOverlappingReservationExcludingMeeting(
            @Param("meetingId") Long meetingId,
            @Param("room") MeetingRoom room,
            @Param("meetingDate") LocalDate meetingDate,
            @Param("startAt") LocalTime startAt,
            @Param("endAt") LocalTime endAt
    );

    List<Meeting> findMeetingByMeetingDateAfterAndMeetingRoom(LocalDate date, MeetingRoom room);

    Optional<Meeting> findBySourceKey(String sourceKey);

    void deleteAll();

}
