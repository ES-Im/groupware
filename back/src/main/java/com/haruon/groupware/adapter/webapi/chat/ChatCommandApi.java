package com.haruon.groupware.adapter.webapi.chat;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.chat.provided.forCommand.ChatRoomManagement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Set;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;

@RestController
@RequestMapping("/api/chat/rooms")
@RequiredArgsConstructor
public class ChatCommandApi {

    private final ChatRoomManagement chatRoomManagement;

    @PostMapping
    public ResponseEntity<ChatRoomIdResponse> createChatRoom(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid RoomMemberIdsRequest request
    ) {
        long roomId = chatRoomManagement
                .makeRoom(details.getEmpId(), request.memberIds, LocalDateTime.now(SEOUL_ZONE));

        return ResponseEntity.ok().body(new ChatRoomIdResponse(roomId));
    }

    @PatchMapping("/{roomId}/invite")
    public ResponseEntity<Void> inviteMembers(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long roomId,
            @RequestBody @Valid RoomMemberIdsRequest request
    ) {
        chatRoomManagement
                .inviteRoomByMember(details.getEmpId(), roomId, request.memberIds, LocalDateTime.now(SEOUL_ZONE));

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{roomId}/name")
    public ResponseEntity<Void> updateRoomDisplayName(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long roomId,
            @RequestBody @Valid RoomNameRequest request
    ) {
        chatRoomManagement.updateDisplayNameByMember(
                roomId, details.getEmpId(), request.name
        );

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{roomId}/leave")
    public ResponseEntity<Void> leaveChatRoom(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long roomId
    ) {
        chatRoomManagement.leaveRoomByMember(roomId, details.getEmpId(), LocalDateTime.now(SEOUL_ZONE));

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{roomId}/bookmark")
    public ResponseEntity<Void> bookmarkChatRoom(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long roomId
    ) {
        chatRoomManagement.markAsBookMarkedByMember(roomId, details.getEmpId());

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{roomId}/unbookmark")
    public ResponseEntity<Void> unbookmarkChatRoom(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long roomId
    ) {
        chatRoomManagement.unmarkAsBookMarkedByMember(roomId, details.getEmpId());

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{roomId}/read-position")
    public ResponseEntity<Void> updateReadPosition(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long roomId,
            @RequestBody @Valid LastReadIdRequest request
    ) {
        chatRoomManagement.renewLatestReadChatByMember(
                details.getEmpId(), roomId, request.lastReadMessageId
        );

        return ResponseEntity.status(204).build();
    }

    public record LastReadIdRequest(
            @NotNull Long lastReadMessageId
    ) {}

    public record RoomNameRequest(
            @NotBlank @Size(max = 20) String name
    ) {}

    public record RoomMemberIdsRequest(
            @NotEmpty Set<Long> memberIds
    ) {}

    public record ChatRoomIdResponse(
            Long roomId
    ) {}

}
