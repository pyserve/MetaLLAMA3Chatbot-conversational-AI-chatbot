import Navbar from './components/navbar';
import ChatContainer from './components/chatContainer';
import Login from './components/login';
import Register from './components/register';
import { useContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './components/css/style.css';
import { AuthContext } from './contexts/authContext';

function App() {
  const { auth, theme } = useContext(AuthContext);

  return (
    <div style={{
      backgroundColor: theme === "light" ? "#FFFFFF" : "#191970",
      height: '100vh'
    }}>
      <BrowserRouter>
        <Navbar />
        <Routes>
            <>
              <Route path="*" Component={ChatContainer} />
            </>
          {/* :
          <>
            <Route path="*" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </>
          } */}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
