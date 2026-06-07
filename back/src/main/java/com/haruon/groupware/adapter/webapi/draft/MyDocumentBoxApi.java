package com.haruon.groupware.adapter.webapi.draft;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/documentBox")
public class MyDocumentBoxApi {

    // 내 기안함 조회 ( 상신 이후에거 전부 조회토록 하기 )

    // 임시저장 기안서 목록

    // 내 결재함 조회

    // 결재 대기함 조회

    // 문서함 페이징 (부서 내 문서 조회 가능 + 부서외에건 결재선이 있거나, 공람으로 되어있으면 가능)
}

/*
todo Draft aggregate 부문 url 좀 더 실용적으로 배치 시켜야할듯
 "/api/documentBox(페이징 위주 문서함)" : 문서 비밀보안 레벨은 신경쓰지 말자 너무 딥하다 무조건 동부서거 + 내가 기안한거 + 내가 결재라인에 있는거 + 내가 공람자인거 조회토록하면 됌
  - 전자문서함 기안한거 따로,
  - 결재대기함 따로(이건 상태에 따라 조회토록하면 될듯),
  - 문서함(동 부서거 + 타부서에서 공람한거 페이징리스트에 있었어),
  - 기안문서임시저장함
 보통 현재로부터 30일 전에거로 페이징 됬었음.. LocalDate.now(서울 존).minusMonth(1) ~ LocalDate.now(서울 존)으로 하고
 "/api/{draftId}/..."
  - 이건 작성/수정/삭제 용 api 따로 ->  api/draft/
  - 조회용 api 따로 -> api/document/
  - 기안서 건건이 보기 - 여기엔 전자 결재 서명 프리뷰 +
  - 파일 업로드 / 프리뷰는 /file/drafts/..... 로 이미 잡아둠

 */