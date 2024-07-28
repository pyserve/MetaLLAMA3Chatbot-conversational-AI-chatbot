import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/authContext";
import { ChatContext } from "../contexts/chatContext";
import History from "./history";
import { Modal } from 'bootstrap';
import 'bootstrap/dist/js/bootstrap';
import $ from 'jquery';

const ChatContainer = () => {
    const navigate = useNavigate();
    // const { chatId } = useParams();
    const { auth, theme } = useContext(AuthContext);
    const { chats, setChats, sessionId } = useContext(ChatContext);
    const [message, setMessage] = useState('');
    const scrollRef = useRef(null);
    const [disableBtn, setDisableBtn] = useState(true);
    const [initialPrompt, setInitialPrompt] = useState({});
    const [isRecording, setIsRecording] = useState(false);
    // const [audioBlob, setAudioBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);
    const modalRef = useRef(null);
    const imageRef = useRef(null);
    const formRef = useRef(null);
    const messageRef = useRef(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [modelImage, setModalImage] = useState(null);
    const DEEPGRAM_API_KEY = "2ad747b7394a1ceeb64a9ee57c4581099f13d427";

    useEffect(() => {
        if(sessionId){
            navigate(`/chat/${sessionId}`);
            const fetchChats = async () => {
                const resp = await fetch("http://127.0.0.1:8000/chats/" + sessionId);
                const result = await resp.json();
                setChats(result.data);
            }
            fetchChats(); 
        }
    }, [sessionId, navigate, setChats])

    useEffect(() => {
        if(auth.user){
            setInitialPrompt({
                role: "system",
                content: "The user chatting with you is " 
                + (auth.user.first_name ? auth.user.first_name : auth.user.email)
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
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        if(imageRef) {
            setTimeout(() => {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }, 1000);
        }
    }, [chats, imageSrc]);

    const handleSubmit = async (e, msg) => {
        e.preventDefault();
        let query = {
            role: "user", 
            content: msg ? msg : message, 
            image: imageRef.current.value ? URL.createObjectURL(imageRef.current.files[0]) : null,
        }
        setMessage('');
        setDisableBtn(true);
        setChats(chats => [...chats, query]);
  
        if(query.image){
            const formData = new FormData();
            formData.append('image', imageRef.current.files[0]);
            formData.append('question', query.content);
            formData.append("uid", auth.user.pk);
            formData.append("sessionId", sessionId);
            clearImage();
            const resp = await fetch("http://127.0.0.1:8000/image/",{
                method: "POST",
                body: formData
            });

            if(resp.status === 200){
                const result = await resp.json();
                setChats(chats => (
                    [
                        ...chats.slice(0, -1), 
                        result.user, 
                        result.assistant
                    ]
                ));
            }
        }
        else{
            const resp = await fetch("http://127.0.0.1:8000", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [initialPrompt, ...chats, query],
                    uid: auth.user.pk,
                    sessionId: sessionId,
                })
            });

            if(resp.status === 200){
                const result = await resp.json();
                setChats(chats => [...chats.slice(0, -1), result.user, result.assistant]);
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
                // setAudioBlob(audioBlob);
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
            messageRef.current.focus();
            console.log(transcribe_result)
        }
        // setAudioBlob(null);
    }

    const handleImageUpload = async(e) => {
        const file = e.target.files[0];
        if(file){
            const reader = new FileReader();
            reader.onload = (e) => {
                setImageSrc(e.target.result);
                messageRef.current.focus();
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
        if(result.pk){
            setModalImage("http://127.0.0.1:8000/media/" + result.image);
        }else{
            setModalImage(result.image);
        }
        const modal = new Modal(modalRef.current, {
            keyboard: false
        });
        modal.show();
    }

    const textToSpeech = async (e, text) => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            $(e.target).removeClass("fa-solid fa-volume-high").addClass("fa-solid fa-volume-off");
        }else{
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.pitch = 1; // default is 1, range is 0 to 2
            utterance.rate = 1;  // default is 1, range is 0.1 to 10
            utterance.volume = 1; // default is 1, range is 0 to 1
            utterance.lang = 'en-US'; // language of the speech
            utterance.voice =  window.speechSynthesis.getVoices()[7];
            utterance.onend = () => {
                setTimeout(() => {
                    $(e.target).removeClass("fa-solid fa-volume-high").addClass("fa-solid fa-volume-off");
                }, 250);
            }
            window.speechSynthesis.speak(utterance);
        }
    }

    const regenerateResponse = async (e, index) => {
        let chat = chats.find((c, i) => i===index-1);
        setChats(chats => chats.slice(0, -2));

        if(chat.image){
            const response = await fetch(chat.image);
            const blob = await response.blob();
            const fileName = chat.image.split('/').pop();
            const file = new File([blob], fileName, { type: blob.type });
            const fileInput = imageRef.current;
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
        }
        setMessage(m => chat.content);
        handleSubmit(e, chat.content);
    } 

    return(
        <div className="container-fluid my-1">
            <div className="row justify-content-center">
                <div className="col-md-3 pe-0">
                    <History />
                </div>
                <div className="col-md-9 ps-1">
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
                                style={{minHeight: '80vh', maxHeight: '80vh',}}
                                ref={scrollRef}>
                                <div className="d-flex flex-column">
                                {chats.map((chat, idx) => {
                                    return(
                                        <div key={idx}>
                                            {chat.role === "user" &&
                                            <div className="d-flex justify-content-end p-2 my-1">
                                                <div className="d-flex justify-content-end align-items-start w-80">
                                                    <div className="me-2">
                                                        <div className="d-flex justify-content-end">
                                                            {(chat.image && chat.pk) &&
                                                            <img src={chat.image ? ("http://127.0.0.1:8000/media/" + chat.image): null} 
                                                                alt="" className="chat-image rounded py-1" 
                                                                type="button" onClick={() => openImagePreview(idx)}></img>
                                                            }

                                                            {(chat.image && !chat.pk) &&
                                                            <img src={chat.image} alt="" className="chat-image rounded py-1" 
                                                                type="button" onClick={() => openImagePreview(idx)}></img>
                                                            }     
                                                        </div>  
                                                        <div className={`bg-custom-${theme}`} style={{whiteSpace: "pre-wrap"}}>
                                                            {chat.content}
                                                        </div>
                                                    </div>
                                                    <span className="ms-1 fs-3">
                                                        <span className="d-inline-flex align-items-center justify-content-center text-capitalize fs-6 text-white bg-danger rounded-circle border border-white" 
                                                            style={{ width: '1.75rem', height: '1.75rem' }}>
                                                            {auth.user.email.charAt(0)}
                                                        </span>
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
                                                            <span className="me-2">
                                                                <i type="button" className="text-muted fa-regular fa-clipboard"
                                                                    onClick={e => {
                                                                        $(e.target).removeClass("fa-regular fa-clipboard").addClass("fa-solid fa-check");
                                                                        navigator.clipboard.writeText(chat.content).then(() => {
                                                                            console.log('Text copied to clipboard successfully!');
                                                                        }).catch((err) => {
                                                                            console.error('Could not copy text: ', err);
                                                                        });
                                                                        setTimeout(() => {
                                                                            $(e.target).removeClass("fa-solid fa-check").addClass("fa-regular fa-clipboard");
                                                                        }, 2000)
                                                                    }}></i>
                                                            </span>
                                                            <span className="mx-2">
                                                                <i type="button" className="text-muted fa-solid fa-volume-off"
                                                                    onClick={e => {
                                                                        $(e.target).removeClass("fa-solid fa-volume-off").addClass("fa-solid fa-volume-high");
                                                                        textToSpeech(e, chat.content);
                                                                    }}></i>
                                                            </span>
                                                            <span className="mx-2">
                                                                <i type="button" className={"text-muted fa-"+ (chat.dislike ? "solid" : "regular") +" fa-thumbs-down"}
                                                                    onClick={e => {
                                                                        setChats(chats => chats.map((chat, i) => {
                                                                            if(i === idx){
                                                                                return {...chat, dislike: !chat.dislike}
                                                                            }
                                                                            return chat;
                                                                        }))
                                                                    }}></i>
                                                            </span>
                                                            {idx === chats.length - 1 &&
                                                            <span className="ms-2">
                                                                <i type="button" className="text-muted fa-solid fa-arrows-rotate"
                                                                    onClick={e => {
                                                                        regenerateResponse(e, idx);
                                                                    }}></i>
                                                            </span>}
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
                                <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-pill">
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
                                        <textarea type="text" placeholder="Chat with BeaverAI"
                                            className="form-control border-0 rounded-0 py-3 overflow-auto d-flex flex-column"
                                            rows={1}
                                            ref={messageRef}
                                            value={message}
                                            onChange={e => setMessage(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                   formRef.current.requestSubmit();
                                                }
                                            }}
                                            style={{ resize: 'none', maxHeight: `${200}px` }}  />
                                        <button className={`btn btn-${disableBtn ? "secondary" : "dark"} rounded-pill ms-1 me-2`} type="submit"
                                            disabled={disableBtn}>
                                            <i className="p-1 fa fa-arrow-up"></i>
                                        </button>
                                    </div>
                                </form>
                            </div>
                            {(chats.length === 0 && !imageSrc) &&
                            <div className="position-absolute top-50 start-50 translate-middle text-center">
                                <div className="card text-center shadow-lg p-2 w-100">
                                    <div className={`card-body py-5 bg-${theme} text-${theme === "light" ? "dark" : "light"}`}>
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