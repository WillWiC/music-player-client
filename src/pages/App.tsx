import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Callback from "./Callback";
import Dashboard from "./Dashboard";
import Search from "./Search";
import Playlist from "./Playlist";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search" element={<Search />} />
        <Route path="/playlist/:id" element={<Playlist />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
