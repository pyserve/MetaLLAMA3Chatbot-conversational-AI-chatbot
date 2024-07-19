import { useState, useContext } from "react";
import { AuthContext } from "../contexts/authContext";

const Login = () => {
    const [credentials, setCredentials] = useState({
        username: '', 
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState({});
    const [disableBtn, setDisableBtn] = useState(false);
    const { loginUser } = useContext(AuthContext);

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
            const resp = await fetch("http://127.0.0.1:8000/accounts/login/",{
                method: "POST",
                body: JSON.stringify({
                    data: credentials
                })
            });

            if(resp.status === 200){
                loginUser(await resp.json());
            }else{
                setError(await resp.json())
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
            </form>
        </div>
      </div>
    );
};
  
  export default Login;