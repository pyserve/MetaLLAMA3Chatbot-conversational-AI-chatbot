import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { API_URL } from "../constants";

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        dob: ''
    });
    const [errors, setErrors] = useState({});
    const [error, setError] = useState({});
    const [disableBtn, setDisableBtn] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData({
          ...formData,
          [id]: value
        });
    };

    const handleSubmit = async(e) => {
        setError({});
        setDisableBtn(true);
        e.preventDefault();
        let err = {}
        if(formData.email.trim() === ''){
            err.email = "Email is required."   
        }
        if(formData.password.trim() === ''){
            err.password = "Password is required."   
        }else if(formData.password.length < 8){
            err.password = "Password length must be 8 or greater."
        }
        setErrors(err);
        if(Object.keys(err).length === 0){
            const resp = await fetch(API_URL + "accounts/register/",{
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if(resp.status === 200){
                console.log(await resp.json());
                navigate("/login/");
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
                Beaver Registration
            </h3>
            <form onSubmit={handleSubmit}>
                {error.message &&
                <div className={"alert alert-danger alert-dismissible fade show "} role="alert">
                    <span className="me-1"><i className="fa-solid fa-circle-exclamation"></i></span>
                    <span className="fw-bold small">{error.message}</span>
                </div>}
                <div className="form-group mb-3">
                    <label htmlFor="email">Email</label>
                    <input type="email" 
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        value={formData.email}
                        onChange={handleChange}
                        id="email" 
                        placeholder="Enter email" />
                    <div className="invalid-feedback">{errors.email}</div>
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="password">Password</label>
                    <input type="password" 
                        className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                        value={formData.password} 
                        onChange={handleChange}
                        id="password" placeholder="Enter password" />
                    <div className="invalid-feedback">{errors.password}</div>
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="fullName">Full Name (optional)</label>
                    <input type="text" 
                        className={`form-control ${errors.fullName ? 'is-invalid' : ''}`}
                        value={formData.fullName} 
                        onChange={handleChange}
                        id="fullName" placeholder="Enter full name" />
                </div>
                <div className="form-group mb-3">
                    <label htmlFor="dob">Date of Birth (optional)</label>
                    <input type="date" 
                        className={`form-control ${errors.dob ? 'is-invalid' : ''}`}
                        value={formData.dob} 
                        onChange={handleChange}
                        id="dob" />
                </div>
                <button className="btn btn-primary w-100" type="submit" disabled={disableBtn}>
                    {disableBtn && <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span>}
                    <span role="status">Register</span>
                </button>
            </form>
        </div>
      </div>
    );
  };
  
  export default Register;