import google from '@/assets/images/login/google.png';

const GOOGLE_AUTH_URL = import.meta.env.VITE_SERVER_BASE_URL + import.meta.env.VITE_OAUTH_GOOGLE_PATH;

const handleGoogleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL;
}

const GoogleLogin = ({
  height
}) => {
  return <>
      <button type="button" onClick={handleGoogleLogin} style={{border: "none", backgroundColor: "transparent"}}>
        <img src={google} alt="logo" height={height ?? 45} />
      </button>
    </>;
};
export default GoogleLogin;