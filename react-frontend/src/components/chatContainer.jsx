import { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from "../contexts/authContext";
import { ChatContext } from "../contexts/chatContext";
// import History from "./history";
import { Modal } from 'bootstrap';
import $ from 'jquery';

const ChatContainer = () => {
    const { auth, theme } = useContext(AuthContext);
    const { chats, setChats } = useContext(ChatContext);
    const [message, setMessage] = useState('');
    const scrollRef = useRef(null);
    const [disableBtn, setDisableBtn] = useState(true);
    const [initialPrompt, setInitialPrompt] = useState({});
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);
    const imageRef = useRef(null);
    const modalRef = useRef(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [modelImage, setModalImage] = useState(null);
    const DEEPGRAM_API_KEY = "2ad747b7394a1ceeb64a9ee57c4581099f13d427";

    useEffect(() => {
        if(auth.user){
            setInitialPrompt({
                role: "system",
                content: "The user chatting with you is " 
                + (auth.user.fields.first_name ? auth.user.fields.first_name : auth.user.fields.email)
            })
        }
    }, [auth]);

    useEffect(() => {
        if (message && message.trim() !== '') {
          setDisableBtn(false);
        } else {
          setDisableBtn(true);
        }
    }, [message]);
    
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [chats, imageSrc]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        let query = {
            role: "user", 
            content: message, 
            image: imageRef.current.value ? URL.createObjectURL(imageRef.current.files[0]) : null,
        }
        setMessage('');
        setDisableBtn(true);
        setChats(chats => [...chats, query]);
        if(query.image){
            const formData = new FormData();
            formData.append('image', imageRef.current.files[0]);
            formData.append('question', query.content);
            clearImage();
            const resp = await fetch("http://127.0.0.1:8000/image/",{
                method: "POST",
                body: formData
            });

            const reply = await resp.json();
            setChats(chats => [...chats, reply]);
        }
        else{
            const resp = await fetch("http://127.0.0.1:8000", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [initialPrompt, ...chats, query],
                })
            });

            if(resp.status === 200){
                const reply = await resp.json();
                setChats(chats => [...chats, reply]);
            }
        }
    }

    const getMicrophoneAccess = async() => {
        try{
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true});
            streamRef.current = stream;
            console.log('Microphone access granted');
            return stream;
        }catch(error){
            console.error('Microphone access denied: ', error);
            return null;
        }
    }
    
    const startRecording = async() => {
        const stream = await getMicrophoneAccess();
        if(stream){
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data)
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                uploadAudio(audioBlob);
            };

            mediaRecorderRef.current.start();
            console.log('Recording started');
            setIsRecording(true);
        }
    }

    const stopRecording = () => {
        mediaRecorderRef.current.stop()
        setIsRecording(false);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop()); // Stop all tracks
            streamRef.current = null;
        }
        console.log("Recording stopped.");
    }

    const uploadAudio = async (audio) => {
        const arrayBuffer = await audio.arrayBuffer();
        const response = await fetch('https://api.deepgram.com/v1/listen?language=en-GB', {
            method: 'POST',
            headers: {
                'Content-Type': 'audio/webm',
                'Authorization': `Token ${DEEPGRAM_API_KEY}`
            },
            body: arrayBuffer
        });
    
        const result = await response.json();
        if (result.results && result.results.channels && result.results.channels[0] && 
            result.results.channels[0].alternatives && result.results.channels[0].alternatives[0]) {
            const transcribe_result = result.results.channels[0].alternatives[0].transcript;
            setMessage(transcribe_result);
            console.log(transcribe_result)
        }
        setAudioBlob(null);
    }

    const handleImageUpload = async(e) => {
        const file = e.target.files[0];
        if(file){
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageSrc(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    }

    const clearImage = () => {
        setImageSrc(null);
        if (imageRef.current) {
          imageRef.current.value = null;
        }
    };

    const openImagePreview = (index) => {
        const result = chats.find((c, i) => i === index);
        setModalImage(result.image);
        const modal = new Modal(modalRef.current, {
            keyboard: false
        });
        modal.show();
    }

    return(
        <div className="container my-1">
            <div className="row justify-content-center">
                {/* <div className="col-md-4 p-1">
                    <History />
                </div> */}
                <div className="col-md-8">
                    <div className="modal fade" ref={modalRef} data-bs-backdrop="static" tabIndex="-1">
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h1 className="modal-title fs-5" id="imagePreviewLabel">Preview Image</h1>
                                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div className="modal-body">
                                    <img src={modelImage} alt="" className="w-100" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={`card border-0 shadow-lg`}>
                        <div className={`card-body p-0 bg-${theme === "light" ? "white": "secondary"} text-${theme === "light" ? "dark": "light"}`}>
                            <div className="overflow-auto my-1 px-3 d-flex flex-column-reverse" 
                                style={{minHeight: '79vh', maxHeight: '79vh',}}
                                ref={scrollRef}>
                                <div className="d-flex flex-column">
                                {chats.map((chat, idx) => {
                                    return(
                                        <div key={idx}>
                                            {chat.role === "user" &&
                                            <div className="d-flex justify-content-end p-2 my-1">
                                                <div className="d-flex justify-content-end align-items-start w-80">
                                                    <div className="text-end me-2">
                                                        {chat.image && 
                                                        <img src={chat.image} alt="" className="chat-image rounded py-1" type="button" onClick={() => openImagePreview(idx)}></img>}   
                                                        <div className={`bg-custom-${theme}`}>
                                                            {chat.content}
                                                        </div>
                                                    </div>
                                                    <span className="ms-1 fs-3">
                                                        <i className="fa-regular fa-circle-user"></i>
                                                    </span>
                                                </div>
                                            </div>}
                                            {chat.role === "assistant" &&
                                            <div className="d-flex justify-content-start p-2 my-2">
                                                <div className="d-flex justify-content-start align-items-start w-80">
                                                    <span className="me-1 fs-3">
                                                        <img src="/img/beaver.jpeg" alt="" 
                                                            className="reply-image rounded-circle" />
                                                    </span>
                                                    <div className="ms-2">
                                                        <span style={{whiteSpace: "pre-wrap"}}>
                                                            {chat.content}
                                                        </span>
                                                        <div className="my-1">
                                                            <span type="button" className="me-2" onClick={e => {
                                                                $(e.currentTarget).find("i").removeClass("fa-regular fa-clipboard").addClass("fa-solid fa-clipboard-checked");
                                                                setTimeout(() => {
                                                                    $(e.currentTarget).find("i").removeClass("fa-solid fa-clipboard-checked").addClass("fa-regular fa-clipboard");
                                                                }, 2000);
                                                            }}>
                                                                <i className="fa-regular fa-clipboard"></i>
                                                            </span>
                                                            <span type="button" className="mx-1"><i className="fa-solid fa-volume-high"></i></span>
                                                            <span type="button" className="mx-1"><i className="fa-regular fa-thumbs-down"></i></span>
                                                            {idx === chats.length - 1 &&
                                                            <span type="button" className="ms-2"><i className="fa-solid fa-arrows-rotate"></i></span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>}
                                        </div>
                                    )
                                })}
                                
                                {(chats.filter(chat => chat.role === "user").length > chats.filter(chat => chat.role === "assistant").length
                                && chats.at(-1).role === "user") &&
                                <div className="d-flex flex-column-reverse justify-content-start my-1">
                                    <div className="d-flex align-items-center bg-white p-2 rounded-pill">
                                        <div className="spinner-grow spinner-grow-sm text-danger mx-1" role="status">
                                        </div>
                                        <div className="spinner-grow spinner-grow-sm text-success mx-1" role="status">
                                        </div>
                                        <div className="spinner-grow spinner-grow-sm text-primary mx-1" role="status">
                                        </div>
                                    </div>
                                </div>}

                                {imageSrc &&
                                <div className="d-flex justify-content-center align-items-start my-1">
                                    <div className="card shadow-lg position-relative">
                                        <div className="card-header p-0">
                                            <img src={imageSrc} alt="" className="uploaded-image" />
                                        </div>
                                        <div className="position-absolute end-0 m-1">
                                            <div className="btn btn-danger rounded-circle" onClick={clearImage}>
                                                <i className="fa fa-close"></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>}

                                </div>
                            </div>
                                
                            <div className={`${theme === "light" ? "bg-light" : ""} border-top p-3 rounded-0`}>
                                <form onSubmit={handleSubmit} className="bg-white rounded-pill">
                                    <div className="d-flex align-items-center form-inputs">
                                        {
                                            isRecording ?
                                            <button className="btn btn-light ms-2 me-1 border rounded-pill" type="button"
                                                onClick={stopRecording}>
                                                <span className="text-danger spinner-grow spinner-grow-sm" aria-hidden="true"></span>
                                            </button>
                                            :
                                            <label className="btn btn-light ms-2 me-1 border rounded-pill"
                                                onClick={isRecording ? stopRecording : startRecording}>
                                                <i className="px-1 fa-solid fa-microphone-lines"></i>
                                            </label>
                                        }
                                        <label htmlFor="image" className="btn btn-light mx-1 border rounded-pill">
                                            <i className="fa-regular fa-images"></i>
                                        </label>
                                        <input type="file" id="image" className="d-none" accept="image/*" ref={imageRef}
                                            onChange={e => handleImageUpload(e)} />
                                        <input type="text" placeholder="what's on your mind!"
                                            className="form-control border-0 rounded-0 py-3"
                                            value={message}
                                            onChange={e => setMessage(e.target.value)} />
                                        <button className="btn btn-secondary rounded-pill ms-1 me-2" type="submit"
                                            disabled={disableBtn}>
                                            <i className="p-1 fa-regular fa-paper-plane"></i>
                                        </button>
                                    </div>
                                </form>
                            </div>
                            {(chats.length === 0 && !imageSrc) &&
                            <div className="position-absolute top-50 start-50 translate-middle text-center">
                                <div className="card text-center shadow-lg p-2 w-100">
                                    <div className="card-body py-5 bg-dark text-light">
                                        <h5 className="card-title fs-3">Hey! What's up ?</h5>
                                        <p className="card-text">I'm Beaver chatbot. An intelligent chatbot from Beaver Intelligence Corp.</p>
                                        <div className="spinner-grow text-primary" role="status"> </div>
                                        <div className="spinner-grow text-success" role="status"> </div>
                                        <div className="spinner-grow text-danger" role="status"> </div>
                                        <div className="spinner-grow text-warning" role="status"> </div>
                                        <div className="spinner-grow text-info" role="status"> </div>
                                        <p className="mt-5 fs-5">What's on your mind ?</p>
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