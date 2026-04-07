package com.haruon.groupware.domain.meetingroom;

import com.haruon.groupware.domain.AbstractFileEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MeetingRoomFile extends AbstractFileEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="room_id", nullable = false)
    private MeetingRoom meetingRoom;

    static MeetingRoomFile create(
            MeetingRoom meetingRoom,
            String mimeType,
            String originalName,
            String extension,
            Long fileSize
    ) {
        MeetingRoomFile roomFile = new MeetingRoomFile();
        roomFile.meetingRoom = requireNonNull(meetingRoom);

        roomFile.initFileMetadata(mimeType, originalName, extension, fileSize);

        return roomFile;
    }

}
