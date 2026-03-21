import kakao from '@/assets/images/login/kakao.png';

const KAKAO_AUTH_URL =  import.meta.env.VITE_SERVER_BASE_URL + import.meta.env.VITE_OAUTH_KAKAO_PATH;

const handlerKakaoLogin = () => {
    window.location.href = KAKAO_AUTH_URL;
}

const KakaoLogin = ({
  height
}) => {
    return <>
        <button type="button" onClick={handlerKakaoLogin} style={{border: "none", backgroundColor: "transparent"}}>
            <img src={kakao} alt="logo" height={height ?? 45} />
        </button>
    </>;
};
export default KakaoLogin;