package com.haruon.groupware.adapter.webapi.board;

import com.haruon.groupware.adapter.security.empDtails.EmpDetails;
import com.haruon.groupware.adapter.webapi.RegisterDomainIdResponse;
import com.haruon.groupware.application.board.provided.forCommand.BoardManagement;
import com.haruon.groupware.application.board.service.command.dto.BoardCreateRequest;
import com.haruon.groupware.application.board.service.command.dto.BoardUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

import static com.haruon.groupware.application.utils.Utils.ZONE_SEOUL;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/boards")
public class BoardCommandApi {

    private final BoardManagement boardManagement;

    @PostMapping
    public ResponseEntity<RegisterDomainIdResponse> boards (
            @AuthenticationPrincipal EmpDetails details,
            @RequestBody @Valid BoardCreateRequest request
    ) {
        long boardId = boardManagement.registerBoard(details.getEmpId(), request);

        return ResponseEntity
                .status(201)
                .body(new RegisterDomainIdResponse(boardId));
    }

    @PatchMapping("/{boardId}/publishment")
    public ResponseEntity<Void> publishBoardDraft(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long boardId
    ) {
        boardManagement.publishBoard(
                details.getEmpId(), boardId, LocalDateTime.now(ZONE_SEOUL)
        );

        return ResponseEntity.status(204).build();
    }

    @PatchMapping("/{boardId}")
    public ResponseEntity<Void> updateBoard(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long boardId,
            @RequestBody @Valid BoardUpdateRequest request
    ) {
        boardManagement.changeBoard(details.getEmpId(), boardId, request);

        return ResponseEntity.status(204).build();
    }

    @DeleteMapping("/{boardId}")
    public ResponseEntity<Void> deleteBoard(
            @AuthenticationPrincipal EmpDetails details,
            @PathVariable Long boardId
    ) {
        boardManagement.deleteBoard(details.getEmpId(), boardId);

        return ResponseEntity.noContent().build();
    }

}
