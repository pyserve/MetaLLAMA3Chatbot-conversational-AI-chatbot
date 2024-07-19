import { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from "../contexts/authContext";
import History from "./history";

const ChatContainer = () => {
    const { auth, theme } = useContext(AuthContext);
    const [chats, setChats] = useState([]);
    const [message, setMessage] = useState('');
    const scrollRef = useRef(null);
    const [disableBtn, setDisableBtn] = useState(true);
    const [initialPrompt, setInitialPrompt] = useState('');

    useEffect(() => {
        if(auth.user){
            setInitialPrompt("User: " 
                + (auth.user.fields.first_name ? auth.user.fields.first_name : auth.user.fields.email) 
                + "\n" + "Assitant: \n")
        }
    }, [auth]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        let query = {role: "user", content: message}
        let prompt = initialPrompt;
        for(let message of chats){
            if(message.role === "user"){
                prompt += `User: ${message.content}\n`;
            }
            if(message.role === "assistant"){
                prompt += `Assistant: ${message.content}\n`;
            }
        }
        prompt = prompt + `User: ${query.content}\n`;
        prompt = prompt + "Assistant: "
        setChats(chats => [...chats, query]);
        setMessage('');
        setDisableBtn(true);

        const resp = await fetch("http://127.0.0.1:8000", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
                text: {
                    role: "user",
                    content: prompt
                }
            })
        });

        if(resp.status === 200){
            const reply = await resp.json();
            setChats(chats => [...chats, reply]);
        }
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chats]);

    return(
        <div className="container my-1">
            <div className="row justify-content-center">
                {/* <div className="col-md-4 p-1">
                    <History />
                </div> */}
                <div className="col-md-8 p-1">
                    <div className={`card border-0 shadow-lg`}>
                        <div className={`card-header border-top bg-light text-${theme === "light" ? "dark": "dark"} p-3`}>
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="dropdown-toggle">Facebook Llama 3</div>
                                <div className="drodown">
                                    <div className="fs-5" data-bs-toggle="dropdown" aria-expanded="false">
                                        <i className="fa-solid fa-ellipsis"></i>
                                    </div>
                                    <ul className="dropdown-menu">
                                        <li className="dropdown-item" type="button"
                                            onClick={() => setChats([])}>Clear Recent Chat</li>
                                        <li className="dropdown-item" type="button">Chat Settings</li>
                                        <li className="dropdown-item" type="button">Logout</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        <div className={`card-body p-0 bg-${theme === "light" ? "white": "secondary"} text-${theme === "light" ? "dark": "light"}`}>
                            <div className="overflow-auto my-1 mx-3" 
                                style={{minHeight: '70vh', maxHeight: '70vh'}}
                                ref={scrollRef}>
                                {chats.map((chat, idx) => {
                                    return(
                                        <div key={idx}>
                                            {chat.role === "user" &&
                                            <div className="d-flex justify-content-end p-2 my-2">
                                                <div className="d-flex justify-content-end align-items-start w-80">
                                                    <span className={`me-2 bg-${theme} p-3 rounded-pill`}>{chat.content}</span>
                                                    <span className="ms-1 border rounded fs-3">
                                                        <i className="fa fa-user-circle p-1"></i>
                                                    </span>
                                                </div>
                                            </div>}
                                            {chat.role === "assistant" &&
                                            <div className="d-flex justify-content-start p-2 my-2">
                                                <div className="d-flex justify-content-start align-items-start w-80">
                                                    <span className="me-1 border rounded fs-3">
                                                        <i className="fa-solid fa-robot p-1"></i>
                                                    </span>
                                                    <span className="ms-2">{chat.content}</span>
                                                </div>
                                            </div>}
                                        </div>
                                    )
                                })}
                                {chats.filter(chat => chat.role === "user").length > chats.filter(chat => chat.role === "assistant").length &&
                                <div className="d-flex justify-content-start my-3">
                                    <div className="d-flex align-items-center bg-white p-2 rounded-pill">
                                        <div className="spinner-grow spinner-grow-sm text-danger mx-1" role="status">
                                        </div>
                                        <div className="spinner-grow spinner-grow-sm text-success mx-1" role="status">
                                        </div>
                                        <div className="spinner-grow spinner-grow-sm text-primary mx-1" role="status">
                                        </div>
                                    </div>
                                </div>}
                            </div>
                            
                            <div className={`${theme === "light" ? "bg-light" : ""} border-top p-3 rounded-0`}>
                                <form onSubmit={handleSubmit} className="bg-white rounded-pill">
                                    <div className="d-flex align-items-center form-inputs">
                                        <label htmlFor="audio" className="btn rounded-end-0">
                                            <i className="fa-solid fa-microphone"></i>
                                        </label>
                                        <input type="file" id="audio" className="d-none" />
                                        <label htmlFor="image" className="btn rounded-0">
                                            <i className="fa fa-image"></i>
                                        </label>
                                        <input type="file" id="image" className="d-none" />
                                        <input type="text" placeholder="what's on your mind!"
                                            className="form-control rounded-0 py-3"
                                            value={message}
                                            onChange={e => {
                                                if(e.target.value && e.target.value.trim() !== ''){
                                                    setDisableBtn(false)
                                                }else{
                                                    setDisableBtn(true)
                                                }
                                                setMessage(e.target.value);
                                            }} />
                                        <button className="border-0 py-2 px-2 mx-2 bg-white" type="submit"
                                            disabled={disableBtn}>
                                            <i className="fa-regular fa-paper-plane"></i>
                                        </button>
                                    </div>
                                </form>
                            </div>
                            {chats.length === 0 &&
                            <div className="position-absolute top-50 start-50 translate-middle text-center">
                                <div className="card text-center shadow-lg p-4" style={{width: "100%"}}>
                                    <div className="card-body">
                                        <h5 className="card-title">Hey! What's up?</h5>
                                        <p className="card-text">I'm a chatbot. I can be helpful if you got some questions!</p>
                                        <div className="spinner-grow text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <div className="spinner-grow text-secondary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <div className="spinner-grow text-success" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <div className="spinner-grow text-danger" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <div className="spinner-grow text-warning" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <div className="spinner-grow text-info" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <div className="spinner-grow text-dark" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-3">What's on your mind?</p>
                                        <p className="font-italic">Please go a head and write it over whatever it is!</p>
                                    </div>
                                </div>
                            </div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatContainer;