package com.haruon.groupware.domain.meeting;

import lombok.Builder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.DynamicTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestFactory;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.Collection;
import java.util.List;
import java.util.stream.Stream;

import static com.haruon.groupware.domain.meeting.MeetingRoom.createMeetingRoom;
import static com.haruon.groupware.domain.meeting.MeetingRoomFixture.getMeetingRoom;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MeetingRoomTest {

    @Test
    @DisplayName("회의실 생성 테스트")
    void create_meeting_room_success() {
        String name = "testRoom";
        String description = "testDescription";
        int capacity = 100;

        MeetingRoom meetingRoom = createMeetingRoom(
                name, description, capacity
        );

        assertThat(meetingRoom).extracting(
                "name", "description", "capacity", "isAvailable"
        ).containsExactly(
                name, description, capacity, true
        );
    }

    private static Stream<Arguments> createFailParams() {
        String name = "testRoom";
        String description = "testDescription";
        int capacity = 100;

        return Stream.of(
                Arguments.of("회의실명이 Null이면 방생성이 안된다.",
                        RoomInfoParam.builder()
                                .name(null)
                                .description(description)
                                .capacity(capacity)
                        .build()
                ),Arguments.of("회의실명이 빈값이면 방생성이 안된다.",
                        RoomInfoParam.builder()
                                .name("")
                                .description(description)
                                .capacity(capacity)
                        .build()
                ),Arguments.of("회의실 설명이 Null이면 방생성이 안된다.",
                        RoomInfoParam.builder()
                                .name(name)
                                .description(null)
                                .capacity(capacity)
                        .build()
                ),Arguments.of("회의실 설명이 빈값이면 방생성이 안된다.",
                        RoomInfoParam.builder()
                                .name(name)
                                .description("")
                                .capacity(capacity)
                        .build()
                ),Arguments.of("수용인원이 Null이면 방생성이 안된다.",
                        RoomInfoParam.builder()
                                .name(name)
                                .description(description)
                                .capacity(null)
                        .build()
                ),Arguments.of("수용인원이 1 미만이면 방생성이 안된다.",
                        RoomInfoParam.builder()
                                .name(name)
                                .description(description)
                                .capacity(0)
                        .build()
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @DisplayName("회의실 생성 실패 케이스")
    @MethodSource("createFailParams")
    void create_meeting_room_fail(String message, RoomInfoParam param) {
        assertThatThrownBy(() ->
            createMeetingRoom(
                    param.name(), param.description(), param.capacity()
            )
        ).isInstanceOf(Exception.class);
    }

    @Test
    @DisplayName("회의실 정보 수정 테스트")
    void change_room_information_success() {
        MeetingRoom room = getMeetingRoom();
        String name = "editName";
        String description = "editDescription";
        int capacity = 9;

        room.changeRoomInfo(name, description, capacity);

        assertThat(room).extracting(
                MeetingRoom::getName,
                MeetingRoom::getDescription,
                MeetingRoom::getCapacity
        ).containsExactly(
                name, description, capacity
        );
    }
    private static Stream<Arguments> updateFailParams() {
        String name = "editName";
        String description = "editDescription";
        int capacity = 9;

        return Stream.of(
                Arguments.of("회의실명이 빈값이면 수정 안된다.",
                        RoomInfoParam.builder()
                                .name("")
                                .description(description)
                                .capacity(capacity)
                                .build()
                ),Arguments.of("회의실 설명이 빈값이면 수정 안된다.",
                        RoomInfoParam.builder()
                                .name(name)
                                .description("")
                                .capacity(capacity)
                                .build()
                ),Arguments.of("수용인원이 1 미만이면 수정 안된다.",
                        RoomInfoParam.builder()
                                .name(name)
                                .description(description)
                                .capacity(0)
                                .build()
                ),Arguments.of("변경할 내용이 없으면 수정 안된다.",
                        RoomInfoParam.builder()
                                .name(null)
                                .description(null)
                                .capacity(null)
                                .build()
                )
        );
    }
    @ParameterizedTest(name = "{index} ==> {0}")
    @DisplayName("회의실 정보 수정 실패 케이스")
    @MethodSource("updateFailParams")
    void edit_meeting_room_fail(String message, RoomInfoParam param) {
        MeetingRoom meetingRoom = getMeetingRoom();
        assertThatThrownBy(() ->
                meetingRoom.changeRoomInfo(
                        param.name(), param.description(), param.capacity()
                )
        ).isInstanceOf(Exception.class);
    }
    @Builder
    private record RoomInfoParam(
            String name,
            String description,
            Integer capacity
    ) {}

    @TestFactory
    Collection<DynamicTest> change_isAvailable() {
        MeetingRoom room = getMeetingRoom();

        return List.of(
            DynamicTest.dynamicTest("회의실 등록시 사용여부는 true", () -> {
                assertThat(room.isAvailable()).isTrue();
            }), DynamicTest.dynamicTest("사용가능상태에서 활성화시킬 수 없다.", () ->{
                assertThatThrownBy(room::activate).isInstanceOf(Exception.class);
            }), DynamicTest.dynamicTest("사용가능 상태에서 비활성화 시킬 수 있다.", () -> {
                room.deactivate();
                assertThat(room.isAvailable()).isFalse();
            }), DynamicTest.dynamicTest("사용부가 상태에서 비활성화 시킬 수 없다.", () -> {
                assertThatThrownBy(room::deactivate).isInstanceOf(Exception.class);
            }), DynamicTest.dynamicTest("사용불가 상태에서 활성화 시킬 수 있다.", () -> {
                room.activate();
                assertThat(room.isAvailable()).isTrue();
            })
        );
    }

    @Test
    @DisplayName("회의실 파일 첨부 테스트")
    void addRoomFileTest() {
        MeetingRoom room = getMeetingRoom();

        String mimeType = "image/png";
        String originName = "origin";
        String storedName = "stored.png";
        String extension = "png";
        long fileSize = 1024L;
        String storedPath = "/test/stored.png";
        room.addRoomFile(mimeType, originName, storedName, extension, fileSize, storedPath);

        assertThat(room.getRoomFiles())
                .singleElement()
                .satisfies(f -> {
                    assertThat(f).extracting(
                            MeetingRoomFile::getMeetingRoom,
                            MeetingRoomFile::getMimeType,
                            MeetingRoomFile::getOriginalName,
                            MeetingRoomFile::getStoredName,
                            MeetingRoomFile::getExtension,
                            MeetingRoomFile::getFileSize,
                            MeetingRoomFile::getStoredPath
                    ).containsExactly(
                            room, mimeType, originName, storedName, extension, fileSize, storedPath
                    );

                    assertThat(f.getStoredName()).isNotNull();
                });
    }

    @Test
    @DisplayName("회의실 파일 삭제 테스트")
    void removeRoomFileTest() {
        MeetingRoom room = getMeetingRoom();

        room.addRoomFile("image/png", "origin", "stored.png", "png", 1024L, "/test/stored.png");
        MeetingRoomFile file = room.getRoomFiles().getFirst();

        room.removeRoomFile(file);

        assertThat(room.getRoomFiles().size()).isEqualTo(0);
    }
}
