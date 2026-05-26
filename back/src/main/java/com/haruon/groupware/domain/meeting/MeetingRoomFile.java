package com.haruon.groupware.domain.meeting;

import com.haruon.groupware.domain.AbstractFileEntity;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static java.util.Objects.requireNonNull;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MeetingRoomFile extends AbstractFileEntity {

    private MeetingRoom meetingRoom;

    static MeetingRoomFile create(
            MeetingRoom meetingRoom,
            String mimeType,
            String originalName,
            String storedName,
            String extension,
            Long fileSize,
            String storedPath
    ) {
        MeetingRoomFile roomFile = new MeetingRoomFile();
        roomFile.meetingRoom = requireNonNull(meetingRoom);

        roomFile.initFileMetadata(mimeType, originalName, storedName, extension, fileSize, storedPath);

        return roomFile;
    }

}
