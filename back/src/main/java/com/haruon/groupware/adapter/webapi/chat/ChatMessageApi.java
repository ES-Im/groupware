package com.haruon.groupware.adapter.webapi.chat;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.chat.provided.forRetrieve.ChatMessageRetriever;
import com.haruon.groupware.application.chat.service.query.dto.ChatMessagesResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/chat/rooms")
@RequiredArgsConstructor
public class ChatMessageApi {

    private final ChatMessageRetriever chatMessageRetriever;

    // 이전 대화기록 가지고 오기
    @GetMapping("/{roomId}/messages")
    public ResponseEntity<ChatMessagesResponse> getChatHistories(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long roomId,
            @RequestParam(required = false) Long cursor,
            @RequestParam(defaultValue = "50") Integer size
    ) {
        ChatMessagesResponse response = chatMessageRetriever
                .retrieveChatMessages(details.getEmpId(), roomId, cursor, size);

        return ResponseEntity.ok().body(response);
    }




}
