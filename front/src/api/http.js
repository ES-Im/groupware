import axios from 'axios';
import {store} from '@/store/store';
import {clearAccessToken, setAccessToken} from "@/store/authSlice.js";
import {logout} from "@/store/userSlice.js";

const SERVER_BASE_URL = import.meta.env.VITE_SERVER_BASE_URL;
const REISSUE_TOKEN_URL = import.meta.env.VITE_ISSUE_TOKEN_PATH;

export const http = axios.create({
    baseURL: SERVER_BASE_URL,
    withCredentials: true,
});

// requestInterceptor
http.interceptors.request.use(
    (config) => {
        const accessToken = store.getState().auth?.accessToken;

        if(accessToken){
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${accessToken}`; // undefined.Authorization 방어
        }
        return config;
    },
    (error) => Promise.reject(error)
);


// responseInterceptor
let isRefreshing = false;
let pendingQueue = [];

function processQueue(error, newToken = null) {
    pendingQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(newToken);
    });
    pendingQueue = [];
}

http.interceptors.response.use((res) => res, async (err) => {
   const originalRequest = err.config;

   // refresh가 필요한 상황인지 체크
   const networkError = !err.response;
   if(networkError) return Promise.reject(err);

   const errorCode = err.response.status;
   const lopeRefreshCall = originalRequest?.url?.includes(REISSUE_TOKEN_URL);

   const unrelatedAuth = !((errorCode === 401 || errorCode === 403) && !lopeRefreshCall);

   const duplicatedRequest = originalRequest._retry;
   if(unrelatedAuth || duplicatedRequest) return Promise.reject(err);

   originalRequest._retry = true;

   // 다중 요청시 토큰 발급은 한번 만 => 이 후 다중요청을 순차적으로 실행토록 queue에 삽입
   if(isRefreshing) {
       return new Promise((resolve, reject) => {
           pendingQueue.push({
               resolve: (newToken) => {
                   originalRequest.headers  = originalRequest.headers ?? {};
                   originalRequest.headers.Authorization = `Bearer ${newToken}`;
                   resolve(http(originalRequest));
               },
               reject,
           });
       });
   }

   isRefreshing = true;

   try {

       const res = await axios.post(
           SERVER_BASE_URL + REISSUE_TOKEN_URL,
           {},
           {withCredentials: true},
       );

       const newAccessToken = res.data.accessToken;

       store.dispatch(setAccessToken(newAccessToken));
       processQueue(null, newAccessToken);  // 큐 실행

       originalRequest.headers  = originalRequest.headers ?? {};
       originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

       return http(originalRequest);

   } catch (refreshErr) {

       processQueue(refreshErr, null);

       store.dispatch(clearAccessToken());
       store.dispatch(logout());

       const promiseReject = Promise.reject(refreshErr);
       setTimeout(() => {
            window.location.href = "/auth/sign-in";
       }, 0)

       return promiseReject
   } finally {
       isRefreshing = false;
   }

});
