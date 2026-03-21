import {createSlice} from "@reduxjs/toolkit";
import {jwtDecode} from "jwt-decode";

const initialState = {
    userKey: null,
    role: null,
    isAuthenticated: false,
}

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserFromToken(state, action) {
            const token = action.payload;

            try {
                const decoded = jwtDecode(token);
                state.userKey = decoded.sub;
                state.role = decoded.role;
                state.isAuthenticated = true;
            } catch (error) {
                state.userKey = null;
                state.role = null;
                state.isAuthenticated = false;
            }
        },

        logout(state) {
            state.userKey = null;
            state.role = null;
            state.isAuthenticated = false;
        }
    }
})

export const { setUserFromToken, logout } = userSlice.actions;
export default userSlice.reducer;