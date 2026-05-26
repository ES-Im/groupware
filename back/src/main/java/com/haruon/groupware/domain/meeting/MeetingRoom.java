package com.haruon.groupware.domain.meeting;

import com.haruon.groupware.domain.AbstractEntity;
import jakarta.persistence.Entity;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.jspecify.annotations.Nullable;

import java.util.ArrayList;
import java.util.List;

import static java.util.Objects.requireNonNull;
import static org.springframework.util.Assert.state;

@Entity
@Getter
@NoArgsConstructor(access= AccessLevel.PROTECTED)
public class MeetingRoom extends AbstractEntity {

    private String name;

    private int capacity;

    private String description;

    private boolean isAvailable;

    private List<MeetingRoomFile> roomFiles = new ArrayList<>();

    public static MeetingRoom createMeetingRoom(String name, String description, int capacity) {
        requireNonNull(name, "룸 이름은 null일 수 없음");
        requireNonNull(description, "설명은 null일 수 없음");

        state(!name.isBlank(), "룸 이름은 빈칸이 될 수 없음");
        state(!description.isBlank(), "설명은 빈칸이 될 수 없음");
        state(capacity > 0, "수용인원은 1명 이상이어야 함");

        MeetingRoom meetingRoom = new MeetingRoom();

        meetingRoom.name = name;
        meetingRoom.description = description;
        meetingRoom.capacity = capacity;
        meetingRoom.isAvailable = true;

        return meetingRoom;
    }

    public void changeRoomInfo(
            @Nullable String name,
            @Nullable String description,
            @Nullable Integer capacity
    ) {
        state(name != null || description != null || capacity != null, "변경할 정보가 없음");

        if(name != null) {
            state(!name.isBlank(), "룸 이름은 빈칸이 될 수 없음");
            this.name = name;
        }

        if(description != null) {
            state(!description.isBlank(), "설명은 빈칸이 될 수 없음");
            this.description = description;
        }

        if(capacity != null) {
            state(capacity > 0, "수용인원은 음수가 될 수 없음");
            this.capacity = capacity;
        }

    }

    public void activate() {
        state(!this.isAvailable, "이미 활성화된 회의실임");
        this.isAvailable = true;
    }

    public void deactivate() {
        state(this.isAvailable, "이미 비활성화된 회의실임");
        this.isAvailable = false;
    }

    public void addRoomFile (
            String mimeType,
            String originalName,
            String storedName,
            String extension,
            Long fileSize,
            String storedPath) {

        this.roomFiles.add(MeetingRoomFile.create(
                this,
                mimeType,
                originalName,
                storedName,
                extension,
                fileSize,
                storedPath
        ));

    }

    public void removeRoomFile(MeetingRoomFile meetingRoomFile) {
        requireNonNull(meetingRoomFile, "삭제할 파일이 없음");
        state(this.roomFiles.contains(meetingRoomFile), "삭제할 파일이 없음");
        this.roomFiles.remove(meetingRoomFile);

    }

 }
