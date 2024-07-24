
import { createContext, useState } from 'react';


export const ChatContext = createContext();

const ChatContextProvider = ({children}) => {
    const [chats, setChats] = useState([]);

    return(
        <ChatContext.Provider value={{ chats, setChats}}>
            {children}
        </ChatContext.Provider>
    )
}

export default ChatContextProvider;