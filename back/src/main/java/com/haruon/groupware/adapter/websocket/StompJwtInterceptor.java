package com.haruon.groupware.adapter.websocket;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.security.empDtails.EmpDetailsService;
import com.haruon.groupware.application.auth.required.TokenParser;
import com.haruon.groupware.application.chat.required.ChatMemberReader;
import com.haruon.groupware.application.exception.chat.NotAllowedChatMemberException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StompJwtInterceptor implements ChannelInterceptor {

    private final TokenParser tokenParser;
    private final EmpDetailsService users;
    private final ChatMemberReader chatMemberReader;
    private final ChatDestinationParser destinationParser;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                message,
                StompHeaderAccessor.class
        );

        if (accessor == null) {
            return message;
        }

        if(StompCommand.CONNECT.equals(accessor.getCommand())) {
            String raw = accessor.getFirstNativeHeader(HttpHeaders.AUTHORIZATION);
            String token = raw != null && raw.startsWith("Bearer ")
                    ? raw.substring(7) : "";

            if(!tokenParser.isValidToken(token, true)) {
                throw new BadCredentialsException("Invalid access token");
            }

            UserDetails user = users.loadUserByUsername(tokenParser.getLoginId(token));

            accessor.setUser(new UsernamePasswordAuthenticationToken(
                    user, null, user.getAuthorities()
            ));
        }

        if(StompCommand.SEND.equals(accessor.getCommand())
            || StompCommand.SUBSCRIBE.equals(accessor.getCommand())
        ) {
            if (!(accessor.getUser() instanceof Authentication authentication)
                    || !(authentication.getPrincipal() instanceof EmpDetails user)) {
                throw new BadCredentialsException("Unauthenticated STOMP session");
            }

            long roomId = destinationParser
                    .parse(accessor.getCommand(), accessor.getDestination())
                    .roomId();

            if(!chatMemberReader.isActiveMember(user.getEmpId(), roomId)) {
                throw new NotAllowedChatMemberException();
            }
        }

        return message;
    }


}
