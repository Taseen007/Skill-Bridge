import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        allChats: [],
        selectedChat: null,
        searchChatText: "",
    },
    reducers: {
        setAllChats: (state, action) => {
            state.allChats = action.payload;
        },
        setSelectedChat: (state, action) => {
            state.selectedChat = action.payload;
        },
        setSearchChatText: (state, action) => {
            state.searchChatText = action.payload;
        },
        clearSelectedChat: (state) => {
            state.selectedChat = null;
        },
        
    },
});

export const {
    setAllChats,
    setSelectedChat,
    setSearchChatText,
    clearSelectedChat,
} = chatSlice.actions;

export default chatSlice.reducer;
