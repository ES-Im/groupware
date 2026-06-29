/**
 * FILE API (rules/api-endpoint.md > FILE API)
 *
 * - preview/download는 binary 응답이므로 http 클라이언트가 Blob을 반환한다.
 * - upload는 multipart이므로 FormData를 그대로 전달한다 (Content-Type은 브라우저가 설정).
 *
 * 리소스 종류(resource)에 따라 경로가 달라지므로 공통 빌더로 처리한다.
 * resource: 'employees' | 'drafts' | 'boards' | 'messages' | 'educations' | 'meeting-rooms'
 */
import {http} from './http/client';

const basePath = (resource, ownerId) => `/api/${resource}/${ownerId}/files`;

/** 파일 미리보기 — GET .../{fileId}/preview → Blob */
export const previewFile = (resource, ownerId, fileId) =>
  http.get(`${basePath(resource, ownerId)}/${fileId}/preview`);

/** 파일 다운로드 — GET .../{fileId}/download → Blob */
export const downloadFile = (resource, ownerId, fileId) =>
  http.get(`${basePath(resource, ownerId)}/${fileId}/download`);

/** 파일 업로드 — PATCH .../files (multipart) */
export const uploadFile = (resource, ownerId, formData) =>
  http.patch(basePath(resource, ownerId), formData);

/** 파일 삭제 — DELETE .../files/{fileId} */
export const deleteFile = (resource, ownerId, fileId) =>
  http.delete(`${basePath(resource, ownerId)}/${fileId}`);

/**
 * Blob을 받아 브라우저 다운로드를 트리거하는 헬퍼.
 * @param {Blob} blob downloadFile()의 반환값
 * @param {string} filename 저장할 파일명
 */
export function saveBlobAsFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
