import naver from '@/assets/images/login/naver.png';

const NAVER_AUTH_URL = import.meta.env.VITE_SERVER_BASE_URL + import.meta.env.VITE_OAUTH_NAVER_PATH;

const handlerNaverLogin = () => {
    window.location.href = NAVER_AUTH_URL;
}

const NaverLogin = ({
  height
}) => {
  return <>
      <button type="button" onClick={handlerNaverLogin} style={{border: "none", backgroundColor: "transparent"}}>
          <img src={naver} alt="logo" height={height ?? 45} />
      </button>
    </>;
};
export default NaverLogin;





