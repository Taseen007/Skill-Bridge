// src/redux/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

// Read synchronously so the very first render already knows if the user is
// logged in — otherwise route guards redirect logged-in users away on refresh
// before the App-level useEffect gets a chance to restore them.
const getStoredUser = () => {
    try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        return storedUser && token ? JSON.parse(storedUser) : null;
    } catch {
        return null;
    }
};

const authSlice = createSlice({
    name: "auth",
    initialState: {
        loading: false,
        user: getStoredUser(),
        notifications: [],
    },
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
        setNotifications: (state, action) => {
            state.notifications = action.payload;
        },
        clearNotifications: (state) => {
            state.notifications = [];
        },
    },
});

export const { setLoading, setUser, setNotifications, clearNotifications } = authSlice.actions;
export default authSlice.reducer;
