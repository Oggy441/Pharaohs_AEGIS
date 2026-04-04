import { Routes, Route } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import NodeExplorer from "./pages/NodeExplorer";
import SleeperHeatmapPage from "./pages/SleeperHeatmapPage";
import ThreatIntel from "./pages/ThreatIntel";
import SchemaMonitor from "./pages/SchemaMonitor";
import Report from "./pages/Report";
import AutonomousResponse from "./pages/AutonomousResponse";
import "./App.css";

function App() {
  return (
    <DataProvider>
      <div className="scanline-overlay" />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/nodes" element={<NodeExplorer />} />
          <Route path="/heatmap" element={<SleeperHeatmapPage />} />
          <Route path="/threats" element={<ThreatIntel />} />
          <Route path="/schema" element={<SchemaMonitor />} />
          <Route path="/report" element={<Report />} />
          <Route path="/response" element={<AutonomousResponse />} />
        </Routes>
      </Layout>
    </DataProvider>
  );
}

export default App;
