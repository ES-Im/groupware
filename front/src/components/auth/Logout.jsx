import {logout} from '@/store/userSlice'
import {useDispatch} from "react-redux";
import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {http} from "@/api/http"

const LOGOUT_URL = import.meta.env.VITE_LOGOUT_PATH;



export default function Logout()  {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        const run = async () => {
            try {
                await http.post(LOGOUT_URL, null);
            } catch (error) {
                console.error("서버 로그아웃 실패 : ", error?.message?? error);
            } finally {
                dispatch(logout());
                alert("로그아웃 성공");
                navigate("/", { replace: true });
            }
        };

        run();
    }, [dispatch, navigate]);

    return null;
}