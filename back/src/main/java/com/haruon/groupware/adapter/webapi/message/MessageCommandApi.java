package com.haruon.groupware.adapter.webapi.message;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.message.provided.forCommand.MessageDraftManagement;
import com.haruon.groupware.application.message.service.command.dto.MessageCreateRequest;
import com.haruon.groupware.application.message.service.command.dto.MessageUpdateRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Set;

import static com.haruon.groupware.application.utils.Utils.ZONE_SEOUL;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/messages")
public class MessageCommandApi {

    private final MessageDraftManagement messageDraftManagement;

    // POST /api/messages/drafts
    @PostMapping("/drafts")
    public ResponseEntity<MessageIdResponse> createDraft(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid MessageCreateRequest request
    ) {
        Long id = messageDraftManagement
                .saveMessageBeforeSend(details.getEmpId(), request);

        return ResponseEntity.status(201).body(new MessageIdResponse(id));
    }

    // POST /api/messages
    @PostMapping
    public ResponseEntity<MessageIdResponse> createSentMessage(
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid MessageCreateRequest request
    ) {
        LocalDateTime current = LocalDateTime.now(ZONE_SEOUL);
        long id = messageDraftManagement.sendMessage(details.getEmpId(), request, current);

        return ResponseEntity.status(201).body(new MessageIdResponse(id));
    }

    // PATCH /api/messages/drafts/{messageId}/send
    @PatchMapping("/drafts/{messageId}/send")
    public ResponseEntity<Void> sendDraftMessage(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long messageId
    ) {
        LocalDateTime current = LocalDateTime.now(ZONE_SEOUL);
        messageDraftManagement.sendDraft(details.getEmpId(), messageId, current);

        return ResponseEntity.status(204).build();
    }

    // DELETE /api/messages/drafts/{messageId}
    @DeleteMapping("/drafts/{messageId}")
    public ResponseEntity<Void> deleteDraftMessage(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long messageId
    ) {
        messageDraftManagement.deleteDraft(details.getEmpId(), messageId);

        return  ResponseEntity.status(204).build();
    }

    // PATCH /api/messages/drafts/{messageId}
    @PatchMapping("/drafts/{messageId}")
    public ResponseEntity<Void> changeDraftMessage(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long messageId,
            @RequestBody @Valid MessageUpdateRequest request
    ) {
        messageDraftManagement.changeDraft(details.getEmpId(), messageId, request);

        return  ResponseEntity.status(204).build();
    }

    // PATCH /api/messages/drafts/{messageId}/receivers
    @PatchMapping("/drafts/{messageId}/receivers")
    public ResponseEntity<Void> changeMessageReceivers(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long messageId,
            @RequestBody @Valid ReceiversRequest request
    ) {
        messageDraftManagement.changeReceivers(details.getEmpId(), messageId, request.receiverIds);

        return ResponseEntity.status(204).build();
    }

    public record MessageIdResponse(
            Long messageId
    ) {}

    public record ReceiversRequest(
            @NotEmpty Set<@NotNull Long> receiverIds
    ) {
    }
}
