package com.haruon.groupware.adapter.webapi.board;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.board.dto.CommandCommentRequest;
import com.haruon.groupware.application.board.provided.forCommand.CommentManagement;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.utils.Utils.ZONE_SEOUL;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class CommentCommandApi {

    private final CommentManagement commentManagement;

    @PostMapping("/{boardId}/comments")
    public ResponseEntity<Void> createComment(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long boardId,
            @RequestBody @Valid CommandCommentRequest request
    ) {
        commentManagement.registerComment(details.getEmpId(), boardId, request.content(), LocalDateTime.now(ZONE_SEOUL));

        return ResponseEntity.status(201).build();
    }

    @PostMapping("/{boardId}/comments/{parentCommentId}/replies")
    public ResponseEntity<Void> createReply(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long boardId,
            @PathVariable Long parentCommentId,
            @RequestBody @Valid CommandCommentRequest request
    ) {
        commentManagement.registerReply(
                details.getEmpId(), boardId, parentCommentId, request.content(), LocalDateTime.now(ZONE_SEOUL)
        );

        return ResponseEntity.status(201).build();
    }

    @PatchMapping("/{boardId}/comments/{commentId}")
    public ResponseEntity<Void> updateComment(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long boardId,
            @PathVariable Long commentId,
            @RequestBody @Valid CommandCommentRequest request
    ) {
        commentManagement.updateComment(
                details.getEmpId(), boardId, commentId, request.content(), LocalDateTime.now(ZONE_SEOUL)
        );

        return ResponseEntity.status(204).build();
    }

    @DeleteMapping("/{boardId}/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long boardId,
            @PathVariable Long commentId
    ) {
        commentManagement.deleteComment(details.getEmpId(), boardId, commentId);

        return ResponseEntity.status(204).build();
    }
}
