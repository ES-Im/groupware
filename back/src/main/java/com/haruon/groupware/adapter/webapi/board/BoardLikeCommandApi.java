package com.haruon.groupware.adapter.webapi.board;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.application.board.provided.LikeManagement;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardLikeCommandApi {

    private final LikeManagement likeManagement;

    @PostMapping("/{boardId}/likes")
    public ResponseEntity<Void> markLikeBoard(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long boardId
    ) {
        likeManagement.like(boardId, details.getEmpId());

        return ResponseEntity.status(201).build();
    }

    @DeleteMapping("/{boardId}/likes")
    public ResponseEntity<Void> unMarkLikeBoard(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long boardId
    ) {
        likeManagement.unlike(boardId, details.getEmpId());

        return ResponseEntity.status(204).build();
    }
}
