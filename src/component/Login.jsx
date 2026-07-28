import React, { useState } from 'react';
import { FaUser, FaLock, FaEnvelope, FaGithub, FaGoogle } from 'react-icons/fa';

import './Login.css';

function MNGLoginPage() {

  const API_URL =  import.meta.env.VITE_API_BASE_URL ;

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isLogin ? `${API_URL}/login` : `${API_URL}/register`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      // debugging: print out response data
      //console.log("Response data:", data);
      if (data.token) {
        localStorage.setItem("token", data.token);

        alert(isLogin ? "Login success!" : "Register success!");
        // display token for debugging
        //console.log("Token:", data.token);

        // Redirect to chat page
        window.location.href = "/chat";


      } else {
        alert("Something went wrong");
      }

    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className = "login-container">
   
      <div className="login-card">

      {/* 标题 */}
      <div className="login-header">
          <h2>{isLogin ? 'Welcome' : 'Create Account'}</h2>
          <p>{isLogin ? 'Login to continue' : 'Start your AI journey'}</p>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="login-form">

          {!isLogin && (
          <div className="input-group">
              <FaUser />
              <input
              type="text"
              name="username"
              placeholder="Username"
              onChange={handleInputChange}
              required
              />
          </div>
          )}

          <div className="input-group">
          <FaEnvelope />
          <input
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleInputChange}
              required
          />
          </div>

          <div className="input-group">
          <FaLock />
          <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleInputChange}
              required
          />
          </div>

          {isLogin && (
          <div className="forgot">
              <a href="#">Forgot password?</a>
          </div>
          )}

          <button className="main-btn">
          {isLogin ? 'Login' : 'Sign Up'}
          </button>


      </form>

      {/* 分割 */}
      <div className="divider">
          <span>OR</span>
      </div>

      {/* 切换 */}
      <div className="switch">
          <p>
          {isLogin ? 'No account?' : 'Already have one?'}
          <span onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? ' Sign up' : ' Login'}
          </span>
          </p>
      </div>

      </div>
    </div>
  );
  
}

export default MNGLoginPage;