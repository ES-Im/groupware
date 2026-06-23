package com.haruon.groupware.adapter.websocket;

import com.haruon.groupware.adapter.security.empDtails.EmpDetailsService;
import com.haruon.groupware.application.auth.required.TokenParser;
import com.haruon.groupware.application.chat.required.ChatMemberReader;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class StompJwtInterceptorTest {

    @Test
    void storesAuthenticatedUserOnConnectMessage() {
        TokenParser tokenParser = mock(TokenParser.class);
        EmpDetailsService users = mock(EmpDetailsService.class);
        ChatMemberReader chatMemberReader = mock(ChatMemberReader.class);
        UserDetails user = mock(UserDetails.class);

        when(tokenParser.isValidToken("access-token", true)).thenReturn(true);
        when(tokenParser.getLoginId("access-token")).thenReturn("loginId");
        when(users.loadUserByUsername("loginId")).thenReturn(user);
        when(user.getAuthorities()).thenReturn(List.of());

        StompJwtInterceptor interceptor = new StompJwtInterceptor(
                tokenParser,
                users,
                chatMemberReader,
                new ChatDestinationParser()
        );
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setNativeHeader(HttpHeaders.AUTHORIZATION, "Bearer access-token");
        accessor.setLeaveMutable(true);
        Message<byte[]> message = MessageBuilder.createMessage(
                new byte[0],
                accessor.getMessageHeaders()
        );

        Message<?> result = interceptor.preSend(message, mock(MessageChannel.class));

        assertThat(result).isSameAs(message);
        assertThat(accessor.getUser()).isInstanceOf(Authentication.class);
        assertThat(((Authentication) accessor.getUser()).getPrincipal()).isSameAs(user);
    }
}
