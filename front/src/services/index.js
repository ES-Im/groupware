/**
 * services 진입점 (barrel)
 *
 * 도메인 간 동일한 함수명(register, sendMessage 등)이 있어 네임스페이스로 묶어 노출한다.
 * 사용 예:
 *   import { authApi, employeeApi } from '@/services';
 *   await authApi.login({ ... });
 *   const me = await employeeApi.getMe();
 *
 * 단일 함수만 필요하면 개별 모듈을 직접 import 해도 된다.
 *   import { getMe } from '@/services/employee';
 */
export * as authApi from './auth';
export * as employeeApi from './employee';
export * as draftApi from './draft';
export * as scheduleApi from './schedule';
export * as departmentApi from './department';
export * as boardApi from './board';
export * as messageApi from './message';
export * as chatApi from './chat';
export * as franchiseApi from './franchise';
export * as fileApi from './file';

export { http, HttpError } from './http/client';
export { getAccessToken, setAccessToken, clearTokens } from './http/token';
