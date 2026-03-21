import {useEffect} from "react";
import {useNavigate} from "react-router-dom";
import {useDispatch} from 'react-redux';

import axios from 'axios';

import {setUserFromToken} from "@/store/userSlice.js";
import {setAccessToken} from "@/store/authSlice.js";

const CALLBACK_PATH =  import.meta.env.VITE_SERVER_BASE_URL + import.meta.env.VITE_ISSUE_TOKEN_PATH;

export default function AuthCallback() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const run = async () => {
            try {
                const res = await axios.post(CALLBACK_PATH, null, { withCredentials: true });
                const accessToken = res.data.accessToken;
                dispatch(setAccessToken(accessToken));
                dispatch(setUserFromToken(accessToken));

                navigate("/dashboard", { replace: true });
            } catch (e) {
                navigate(`/auth/sign-in?error=true`, { replace: true });
            }
        };

        run();
    }, [dispatch, navigate]);

    return null;

}

