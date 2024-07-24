import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/authContext";
import { ChatContext } from "../contexts/chatContext";

const Navbar = () => {
    const { auth, logoutUser, theme, toggleTheme } = useContext(AuthContext);
    const { setChats } = useContext(ChatContext);

    return(
        <div className={`navbar navbar-expand navbar-${theme} bg-${theme} shadow-md py-0`}>
            <div className="container">
                <div className="d-flex align-items-center">
                    <Link to="/" className="navbar-brand d-flex align-items-center">
                        <div className="me-1">
                            <img src="/img/beaver.jpeg" alt="" className="w-100 brand-image rounded-circle" />
                        </div>
                    </Link>
                    <div className="px-3 dropdown">
                        <div className={"dropdown-toggle fst-italic py-2 text-" + 
                            (theme === "light" ? "dark": "light")
                        }
                            data-bs-toggle="dropdown" aria-expanded="false" type="button">
                            Llama 3
                        </div>
                        <div className="dropdown-menu py-0">
                            <div className="dropdown-item border-bottom">
                                <i className="fa-brands fa-nfc-symbol me-2"></i>
                                <span>Llama 3</span>
                            </div>
                            <div className="dropdown-item border-bottom">
                                <span className="ms-3">Coming soon ...</span>
                            </div>
                        </div>
                    </div>
                </div>
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
                            <ul className="dropdown-menu p-0">
                                <li className="border-bottom">
                                    <Link className="dropdown-item" onClick={() => setChats([])}>
                                        <i className="me-2 fa fa-eraser"></i> Clear Chat
                                    </Link>
                                </li>
                                <li className="border-bottom">
                                    <Link className="dropdown-item" to="/accounts/profile">
                                        <i className="me-2 fa fa-user"></i> Profile
                                    </Link>
                                </li>
                                <li className="border-bottom">
                                    <Link className="dropdown-item" onClick={() => logoutUser()}>
                                        <i className="me-2 fa fa-sign-out"></i> Logout
                                    </Link>
                                </li>
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