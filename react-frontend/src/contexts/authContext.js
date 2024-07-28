import { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext();

const AuthContextProvider = ({children}) => {
    const [auth, setAuth] = useState(() => {
        const storedAuth = localStorage.getItem('auth');
        return storedAuth ? JSON.parse(storedAuth) : { user: null };
    });
    const [theme, setTheme] = useState(() => {
        const storedTheme = localStorage.getItem('theme');
        return storedTheme ? storedTheme : "light";
    });
    const [csrfToken, setCsrfToken] = useState(() => {
        return localStorage.getItem('csrfToken');
    });

    useEffect(() => {
        const fetchCSRF = async () => {
            const resp = await fetch("http://127.0.0.1:8000/csrf/", {
                credentials: 'include'
            });
            const result = await resp.json();
            setCsrfToken(result.csrfToken);
            localStorage.setItem('csrfToken', result.csrfToken);
        }
        fetchCSRF();
    }, []);

    useEffect(() => {
        localStorage.setItem('auth', JSON.stringify(auth));
    }, [auth]);

    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    const loginUser = (response) => {
        setAuth(response);
        localStorage.setItem('auth', JSON.stringify(response));
    }

    const logoutUser = () => {
        setAuth({ user: null });
        localStorage.removeItem('auth');
    }

    const toggleTheme = () => {
        setTheme(theme => theme === "light" ? "dark" : "light");
    }

    return(
        <AuthContext.Provider value={{ auth, loginUser, logoutUser, theme, toggleTheme, csrfToken }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContextProvider;