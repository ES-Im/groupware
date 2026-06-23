package com.haruon.groupware.adapter.websocket;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.websocket.dto.ChatClientSend;
import com.haruon.groupware.application.chat.provided.forCommand.ChatSender;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.time.LocalDateTime;

import static com.haruon.groupware.application.utils.Utils.SEOUL_ZONE;

/**
 * STOMP 요청 수신
 */
@Controller
@RequiredArgsConstructor
public class ChatStompController {


    private final ChatSender chatSender;

    @MessageMapping("/chat/rooms/{roomId}/messages")
    public void sendTo(
            @DestinationVariable Long roomId,
            @Valid ChatClientSend command,
            Principal principal
    ) {
        EmpDetails sender =
                (EmpDetails) ((Authentication) principal).getPrincipal();

        LocalDateTime current = LocalDateTime.now(SEOUL_ZONE);

        chatSender.send(
                roomId,
                sender.getEmpId(),
                command.clientMessageId().toString(),
                command.content(),
                current
        );
    }

}
