import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/authContext";

const Navbar = () => {
    const { auth, theme, toggleTheme } = useContext(AuthContext);

    return(
        <div className={`navbar navbar-expand navbar-${theme} bg-${theme} shadow-md`}>
            <div className="container">
                <Link to="/" className="navbar-brand d-flex align-items-center">
                    <div className="me-1">
                        <img src="/img/beaver.jpeg" alt="" className="w-100 brand-image" />
                    </div>
                    {/* <div className="ms-1">Beaver Chatbot</div> */}
                </Link>
                <div>
                    <ul className="navbar-nav ms-auto align-items-center">
                        <li className="nav-item">
                            <div className="nav-link"
                                onClick={toggleTheme}>
                                {theme === "light" ?
                                <i className="fa-solid fa-sun"></i>
                                :
                                <i className="fa-regular fa-sun"></i>}
                            </div>
                        </li>
                        {auth.user ?
                        <li className="nav-item position-relative dropdown">
                            <Link to="/profile/" className="nav-link dropdown-toggle" 
                                data-bs-toggle="dropdown" aria-expanded="false">
                                Account
                            </Link>
                            <ul className="dropdown-menu">
                                <li><Link className="dropdown-item" to="/accounts/profile">Profile</Link></li>
                                <li><Link className="dropdown-item" to="/logout">Logout</Link></li>
                            </ul>
                        </li>
                        :
                        <>
                            <li className="nav-item">
                                <Link to="/login/" className="nav-link">Login</Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/register/" className="nav-link">Register</Link>
                            </li>
                        </>}
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default Navbar;