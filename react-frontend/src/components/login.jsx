import { useState, useContext } from "react";
import { AuthContext } from "../contexts/authContext";
import { ChatContext } from "../contexts/chatContext";
import { Link, useNavigate } from 'react-router-dom';
import axios from "axios";
import { API_URL } from "../constants";

const Login = () => {
    const navigate = useNavigate()
    const [credentials, setCredentials] = useState({
        username: '', 
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState({});
    const [disableBtn, setDisableBtn] = useState(false);
    const { loginUser } = useContext(AuthContext);
    const { createNewSessionId } = useContext(ChatContext);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setCredentials({
          ...credentials,
          [id]: value
        });
    };
    
    const handleSubmit = async (e) => {
        setError({});
        setDisableBtn(true);
        e.preventDefault();
        let err = {}
        if(credentials.username.trim() === '') err.username = "Username is required."
        if(credentials.password.trim() === '') err.password = "Password is required."
        setErrors(err);

        if(Object.keys(err).length === 0){
            try{
                const resp = await axios.post(API_URL + "accounts/login/", credentials);
                loginUser(resp.data);
                const newSessionId = createNewSessionId();
                navigate(`/chat/${newSessionId}`);
            }catch(err){
                setError(err.response.data);
                setDisableBtn(false);
            }
        }
        setDisableBtn(false);
    }
    
    return (
      <div className="container d-flex justify-content-center align-items-center vh-75">
        <div className="card p-4 shadow-lg" style={{ width: '100%', maxWidth: '400px' }}>
            <div className="text-center">
                <img src="/img/beaver.jpeg" alt="" className="w-25" />
            </div>
            <h3 className="card-title text-center mb-4">
                Beaver Login
            </h3>
            <form onSubmit={handleSubmit}>
                {error.message &&
                <div className={"alert alert-danger alert-dismissible fade show "} role="alert">
                    <div className="d-flex align-items-center">
                        <span className="me-1"><i className="fa-solid fa-circle-exclamation"></i></span>
                        <span className="fw-bold small ms-1">{error.message}</span>
                    </div>
                </div>}
                <div className="form-group mb-3">
                    <label htmlFor="username">Username</label>
                    <input type="text" 
                        className={`form-control ${errors.username ? 'is-invalid' : ''}`}
                        value={credentials.username}
                        onChange={handleChange} 
                        id="username" placeholder="Enter username" />
                    <div className="invalid-feedback">{errors.username}</div>
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="password">Password</label>
                    <input type="password"
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        value={credentials.password}
                        onChange={handleChange}
                        id="password" placeholder="Enter password" />
                    <div className="invalid-feedback">{errors.password}</div>
                </div>
                <button type="submit" className="btn btn-primary w-100" disabled={disableBtn}>
                    {disableBtn && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>}
                    <span role="status">Login</span>
                </button>
                <div className="my-2 d-flex align-items-center">
                    <hr className="flex-grow-1 mx-2" />
                    <span className="fs-6">OR</span>
                    <hr className="flex-grow-1 mx-2" />
                </div>
                <div className="my-2 d-flex justify-content-between">
                    <Link className="nav-link" to={'/register'}>Register</Link>
                    <Link className="nav-link" to={'/forget-password'}>Forget Password</Link>
                </div>
            </form>
        </div>
      </div>
    );
};
  
  export default Login;