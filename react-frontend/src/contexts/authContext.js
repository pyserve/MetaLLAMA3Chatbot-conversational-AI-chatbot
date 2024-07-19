
import { createContext, useEffect, useState } from 'react';


export const AuthContext = createContext();

const AuthContextProvider = ({children}) => {
    const [auth, setAuth] = useState({
        user: null,
    });
    const [theme, setTheme] = useState("light");

    useEffect(() => {
        const fetchUser = async() => {
            const resp = await fetch("http://127.0.0.1:8000/auth/");
            if(resp.status === 200) setAuth(await resp.json());
        }
        fetchUser();
    }, []);

    const loginUser = (response) => {
        setAuth(response);
    }

    const toggleTheme = () => {
        setTheme(theme => theme === "light" ? "dark" : "light");
    }

    return(
        <AuthContext.Provider value={{ auth, loginUser, theme, toggleTheme}}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContextProvider;