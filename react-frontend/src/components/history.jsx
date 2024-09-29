import { useContext, useEffect, useState, useRef } from "react";
import { AuthContext } from "../contexts/authContext";
import { ChatContext } from "../contexts/chatContext";
import { Modal } from 'bootstrap';
import * as $ from 'jquery';
import { API_URL } from "../constants";

const History = ({ show, toggleHistory }) => {
    const { auth, theme } = useContext(AuthContext);
    const { chats, sessionId, changeSessionId } = useContext(ChatContext);
    const [chatSessions, setChatSessions] = useState([]);
    const modalRef = useRef(null);
    const [renameText, setRenameText] = useState('');
 
    useEffect(() => {
        if(chats.length <= 2){
            const fetchSessions = async () => {
                const resp = await fetch(API_URL + "sessions/" + auth.user.pk);
                const results = await resp.json();
                setChatSessions(results.data);
            }
            fetchSessions();
        }
    }, [auth, chats]);

    const confirmDelete = () => {
        return new Promise((resolve) => {
            const element = $("#popup-alert");
            element.removeClass("d-none");

            $("#closePopupBtn, #cancelPopupBtn").click(() => {
                element.addClass("d-none");
                resolve(false);
            })

            $("#deletePopupBtn").click(() => {
                element.addClass("d-none");
                resolve(true);
            })
        })
    }
    const handleChangeSession = (newSessionId) => {
        changeSessionId(newSessionId);
    }

    const handleDeleteChat = async (session) => {
        const resp = await confirmDelete();
        if(resp){
            const res = await fetch(API_URL + "sessions/?pk=" + session.pk, {
                method: "DELETE"
            });
            if(res.status === 200){
                let results = await res.json();
                setChatSessions(results.data);
                handleChangeSession(results.data[0].session_id);
            }
        }
    }

    const handleRenameChat = (session, index) => {
        const modal = new Modal(modalRef.current, {
            keyboard: false
        });
        setRenameText(session.caption);
        $("#modal-chat-id-input").val(index);
        modal.show();
    }

    const handleRenameSave = async () => {
        const index = parseInt($("#modal-chat-id-input").val());
        const res = await fetch(API_URL + "sessions/?caption=true", {
            method: "PUT",
            body: JSON.stringify({
                caption: renameText,
                sessionId,
            })
        }) 
        const result = await res.json();
        if(result.data){
            setChatSessions(sessions => sessions.map((session, idx) => {
                if(idx === index){
                    return ({...session, caption: result.data.caption})
                }
                return session;
            }));
        }
        setRenameText('');
    }

    return(
        <div className="card shadow-lg border-0">
            <div className="modal face" ref={modalRef} tabIndex="-1">
                <div className="modal-dialog">
                    <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Rename Chat History</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div className="modal-body">
                        <input type="text" id="modal-chat-id-input" className="d-none" />
                        <textarea name="" className="form-control"
                            rows={7}
                            value={renameText}
                            onChange={e => setRenameText(e.target.value)}></textarea>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" className="btn btn-primary" data-bs-dismiss="modal"
                            onClick={() => handleRenameSave()}>Save changes</button>
                    </div>
                    </div>
                </div>
            </div>

            <div id="popup-alert" className="popup d-none">
                <div className="popup-content">
                    <div className="border-bottom p-2 d-flex justify-content-between alert alert-primary">
                        <div className="" style={{fontSize: "1.2rem"}}>
                            <i className="fa-solid fa-triangle-exclamation me-1"></i>
                            <span className="">Delete Chat History ?</span>
                        </div>
                        <div className="btn-close" id="closePopupBtn"></div>
                    </div>
                    <div className="p-3 py-2">
                        <div className="py-1 text-secondary">Are you sure to delete this chat history ?</div>
                        <div className="pt-3">
                            <button className="me-1 btn btn-light rounded-0" id="cancelPopupBtn">
                                <i className="fa fa-close"></i> Cancel
                            </button>
                            <button className="ms-1 btn btn-danger rounded-0" id="deletePopupBtn">
                                <i className="small fa fa-trash-can"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`card-header p-3 bg-${theme === "light" ? "white" : "secondary"} 
                text-${theme === "light" ? "dark" : "white"} border-top`}>
                <div className="d-flex justify-content-between alig-items-center">
                    <div className="fw-bold">Chat History</div>
                    <div className="" onClick={toggleHistory}>
                        {show && <i type="button" className="fa-solid fa-circle-chevron-left fs-5"></i>}
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
                                    <div className="col-11 d-flex align-items-center">
                                        <div className="fw-bold me-1"></div>
                                        <div className={"ms-1 col-11 text-truncate small text-" + 
                                            (theme === "light"? sessionId === session.session_id ? "dark": "secondary" : "light")
                                        }>
                                            {session.caption}
                                        </div>
                                    </div>
                                    <div className="col-1 dropdown">
                                        <i className="fa-solid fa-ellipsis" 
                                            type="button" 
                                            data-bs-toggle="dropdown" 
                                            aria-expanded="false"></i>
                                        <div className="dropdown-menu p-0">
                                            <div className="dropdown-item border-bottom" onClick={() => {
                                                handleRenameChat(session, idx)
                                            }}>
                                                <i className="small me-1 fa-solid fa-edit"></i> Rename
                                            </div>
                                            <div className="dropdown-item border-bottom text-danger"
                                                onClick={e => handleDeleteChat(session)}>
                                                <i className="small me-1 fa-regular fa-trash-can"></i> Delete
                                            </div>
                                        </div>
                                    </div>
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