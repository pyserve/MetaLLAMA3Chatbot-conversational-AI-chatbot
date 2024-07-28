import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/authContext";
import { ChatContext } from "../contexts/chatContext";

const History = () => {
    const { auth, theme } = useContext(AuthContext);
    const { chats, sessionId, changeSessionId } = useContext(ChatContext);
    const [chatSessions, setChatSessions] = useState([])

    useEffect(() => {
        if(chats.length <= 2){
            const fetchSessions = async () => {
                const resp = await fetch("http://127.0.0.1:8000/sessions/" + auth.user.pk);
                const results = await resp.json();
                setChatSessions(results.data);
            }
            fetchSessions();
        }
    }, [auth, chats]);

    const handleChangeSession = (newSessionId) => {
        changeSessionId(newSessionId);
    }

    return(
        <div className="card shadow-lg border-0">
            <div className={`card-header p-3 bg-${theme === "light" ? "white" : "secondary"} 
                text-${theme === "light" ? "dark" : "white"} border-top`}>
                <div className="d-flex justify-content-between alig-items-center">
                    <div className="fw-bold">Chat History</div>
                    <div className="">
                        <i className="fa fa-edit"></i>
                    </div>
                </div>
            </div>
            <div className={`p-0 card-body bg-${theme === "light" ? "white" : "secondary"} 
                text-${theme === "light" ? "dark" : "white"} overflow-auto`} style={{
                minHeight: '85vh',
                maxHeight: '85vh'
            }}>
                <ul className="list-group p-0 rounded-0">
                    {chatSessions.map((session, idx) => {
                        return(
                            <li onClick={() => handleChangeSession(session.session_id)} key={idx} 
                                className={"history-item" + 
                                (sessionId === session.session_id  ? " history-item-active" : "")}>
                                <div className="d-flex justify-content-between align-items-center">
                                    <div className="col-11 d-flex align-items-center text-muted">
                                        <div className="fw-bold me-1"></div>
                                        <div className="ms-1 col-11 text-truncate small">
                                            {session.caption}
                                        </div>
                                    </div>
                                    <div className="col-1"><i className="fa-solid fa-ellipsis"></i></div>
                                </div>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </div>
    )
}

export default History;