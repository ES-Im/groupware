package com.haruon.groupware.adapter.webapi.message;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.message.provided.forCommand.SentMessageManagement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.utils.Utils.ZONE_SEOUL;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/messages/sent")
public class SentMessageCommandApi {

    private final SentMessageManagement sentMessageManagement;

    @PatchMapping("/{messageId}/trash")
    public ResponseEntity<Void> moveMessageToTrash(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long messageId
    ) {
        LocalDateTime current = LocalDateTime.now(ZONE_SEOUL);

        sentMessageManagement.moveToTrashBySender(
                details.getEmpId(), messageId, current
        );

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{messageId}/trash/restoration")
    public ResponseEntity<Void> restoreMessageFromTrash(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long messageId
    ) {
        sentMessageManagement.restoreFromTrashBySender(
                details.getEmpId(), messageId
        );

        return ResponseEntity.status(204).build();
    }
    @PatchMapping("/{messageId}/deletion")
    public ResponseEntity<Void> deleteMessage(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long messageId
    ) {
        LocalDateTime current = LocalDateTime.now(ZONE_SEOUL);

        sentMessageManagement.deleteFromBoxBySender(
                details.getEmpId(), messageId, current
        );

        return ResponseEntity.status(204).build();
    }
}
