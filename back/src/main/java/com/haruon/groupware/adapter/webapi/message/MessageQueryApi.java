package com.haruon.groupware.adapter.webapi.message;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.file.dto.response.FileListInfo;
import com.haruon.groupware.application.message.provided.forRetrieve.MessageRetriever;
import com.haruon.groupware.application.message.service.query.dto.MessageCountResponse;
import com.haruon.groupware.application.message.service.query.dto.MessageDetailResponse;
import com.haruon.groupware.application.message.service.query.dto.MessagesResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/messages")
public class MessageQueryApi {

    private final MessageRetriever messageRetreiver;

    // 받은 쪽지함 GET /api/messages/received
    @GetMapping("/received")
    public ResponseEntity<Page<MessagesResponse>> getReceivedMessages(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean isRead,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<MessagesResponse> responses = messageRetreiver
                .retrieveReceivedMessages(details.getEmpId(), keyword, isRead, pageable);

        return ResponseEntity.ok().body(responses);
    }

    // 보낸 쪽지함 GET /api/messages/sent
    @GetMapping("/sent")
    public ResponseEntity<Page<MessagesResponse>> getSentMessages(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<MessagesResponse> responses = messageRetreiver
                .retrieveSentMessages(details.getEmpId(), keyword, pageable);

        return ResponseEntity.ok().body(responses);
    }

    // 쪽지 임시 보관함 GET /api/messages/drafts
    @GetMapping("/drafts")
    public ResponseEntity<Page<MessagesResponse>> getDraftMessages(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<MessagesResponse> responses = messageRetreiver
            .retrieveDraftMessages(details.getEmpId(), keyword, pageable);

        return ResponseEntity.ok().body(responses);
    }

    // 휴지통 GET /api/messages/trash
    @GetMapping("/trash")
    public ResponseEntity<Page<MessagesResponse>> getMessagesInTrash(
            @AuthenticationPrincipal EmpDetails details,
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 10, page = 0) Pageable pageable
    ) {
        Page<MessagesResponse> responses = messageRetreiver
                .retrieveMessagesInTrash(details.getEmpId(), keyword, pageable);

        return ResponseEntity.ok().body(responses);
    }

    //쪽지 상세보기 GET /api/messages/{messageId}
    @GetMapping("/{messageId}")
    public ResponseEntity<MessageDetailResponse> getMessageDetailResponse(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long messageId
    ) {
        MessageDetailResponse response = messageRetreiver
                .retrieveMessage(details.getEmpId(), messageId);

        return ResponseEntity.ok().body(response);
    }

    //메시지함 카운트 GET /api/messages/mailboxes/counts
    @GetMapping("/mailboxes/counts")
    public ResponseEntity<MessageCountResponse> getMessageCountResponse(
            @AuthenticationPrincipal EmpDetails details
    ) {
        MessageCountResponse response = messageRetreiver
                .retrieveMessageCount(details.getEmpId());

        return ResponseEntity.ok().body(response);
    }

    //쪽지 상세보기 - 첨부파일 GET /api/messages/{messageId}/files
    @GetMapping("/{messageId}/files")
    public ResponseEntity<List<FileListInfo>> getMessageFileList(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long messageId
    ) {
        List<FileListInfo> fileList = messageRetreiver
                .retrieveMessageFiles(details.getEmpId(), messageId);

        return ResponseEntity.ok().body(fileList);
    }


}
