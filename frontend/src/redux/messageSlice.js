import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
    name: "message",
    initialState: {
        messages: [],          
        sendingStatus: "idle", 
    },
    reducers: {
        setMessages: (state, action) => {
            state.messages = action.payload;
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload); 
        },
        setSendingStatus: (state, action) => {
            state.sendingStatus = action.payload; 
        },
        clearMessages: (state) => {
            state.messages = []; 
        },
        
    },
});

export const {
    setMessages,
    addMessage,
    setSendingStatus,
    clearMessages
} = messageSlice.actions;

export default messageSlice.reducer;
