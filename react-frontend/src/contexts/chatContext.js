
import { createContext, useEffect, useState } from 'react';

export const ChatContext = createContext();

const generateSessionId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = (c === 'x') ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
}

const ChatContextProvider = ({children}) => {
    const [chats, setChats] = useState([]);
    const [sessionId, setSessionId] = useState(() => sessionStorage.getItem('sessionId') || null);

    useEffect(() => {
        if (!sessionId) {
            const newSessionId = generateSessionId();
            sessionStorage.setItem('sessionId', newSessionId);
            setSessionId(newSessionId);
        }
    }, [sessionId]);

    const createNewSessionId = () => {
        const newSessionId = generateSessionId();
        sessionStorage.setItem('sessionId', newSessionId);
        setSessionId(newSessionId);
        setChats([]);
        return newSessionId;
    };

    const changeSessionId = (newSessionId) => {
        sessionStorage.setItem('sessionId', newSessionId);
        setSessionId(newSessionId);
    }

    return(
        <ChatContext.Provider value={{ chats, setChats, sessionId, createNewSessionId, changeSessionId }}>
            {children}
        </ChatContext.Provider>
    )
}

export default ChatContextProvider;