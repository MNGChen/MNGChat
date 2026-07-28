import './App.css'
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Outlet
} from "react-router-dom";


import MNGChatTool from "./component/ChatTool.jsx";
import MNGLogin from "./component/Login.jsx";
import MNGChatAdmin from "./component/ChatAdmin.jsx";


// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

const NavbarLayout = () => {
  return (
    <>
      <MNGNavbar />
     
      <Outlet />
    </>
  );
};

function App() {
  
  
  return (
    <Router>
      <Routes>
        
        
        <Route path="/chat" element={<MNGChatTool />} />
        <Route path="/chat_admin" element={<MNGChatAdmin />} />
        <Route path="/login" element={<MNGLogin />} />
        <Route path="/" element={<MNGLogin />} />
      </Routes>
    </Router>
  );
}

export default App
