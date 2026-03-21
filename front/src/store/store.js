import {configureStore} from "@reduxjs/toolkit"
import userReducer from "./userSlice.js"
import authReducer from "./authSlice.js"

export const store =
    configureStore({
    reducer: {
        user: userReducer,
        auth: authReducer,
    }
});