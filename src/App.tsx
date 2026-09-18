import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";

import Landing from "./components/Landing";
import CityExplorer from "./components/CityExplorer";
import Environment from "./components/Environment";
import Mobility from "./components/Mobility";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/explore" element={<CityExplorer />} />
      <Route path="/city" element={<Navigate to="/explore" replace />} />
      <Route path="/systems/environment" element={<Environment />} />
      <Route path="/systems/mobility" element={<Mobility />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
