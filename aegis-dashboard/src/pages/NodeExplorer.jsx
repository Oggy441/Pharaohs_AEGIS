import { useState } from "react";
import { useData } from "../context/DataContext";
import Panel from "../components/Panel";
import "./NodeExplorer.css";

export default function NodeExplorer() {
  const { data } = useData();
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState("suspect_score");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const ROWS = 20;

  if (!data) return null;

  let nodes = [...data.nodes];
  if (filter) {
    const q = filter.toLowerCase();
    nodes = nodes.filter(
      (n) =>
        String(n.node_id).includes(q) ||
        n.decoded_serial.toLowerCase().includes(q) ||
        n.true_status.toLowerCase().includes(q),
    );
  }

  nodes.sort((a, b) => {
    let va = a[sortKey],
      vb = b[sortKey];
    if (typeof va === "string")
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    return sortAsc ? va - vb : vb - va;
  });

  const totalPages = Math.ceil(nodes.length / ROWS);
  const start = page * ROWS;
  const pageNodes = nodes.slice(start, start + ROWS);

  const handleSort = (k) => {
    if (sortKey === k) setSortAsc(!sortAsc);
    else {
      setSortKey(k);
      setSortAsc(false);
    }
  };

  return (
    <div
      className="fade-in"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Panel
        title="Asset Registry"
        icon="REG"
        className="flex-panel"
        controls={
          <input
            type="text"
            className="search-input"
            placeholder="Search nodes..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(0);
            }}
          />
        }
        footer={
          <div className="pagination">
            <button
              className="btn-control"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              &lt; PREV
            </button>
            <span className="text-dim text-xs">
              Page {page + 1} / {totalPages || 1}
            </span>
            <button
              className="btn-control"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              NEXT &gt;
            </button>
          </div>
        }
      >
        <div className="table-container">
          <table className="registry-table">
            <thead>
              <tr>
                <th onClick={() => handleSort("node_id")}>
                  Node ID {sortKey === "node_id" && (sortAsc ? "▲" : "▼")}
                </th>
                <th>Masked ID</th>
                <th onClick={() => handleSort("decoded_serial")}>
                  Decoded Serial{" "}
                  {sortKey === "decoded_serial" && (sortAsc ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("true_status")}>
                  Status {sortKey === "true_status" && (sortAsc ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("suspect_score")}>
                  Flag {sortKey === "suspect_score" && (sortAsc ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("mismatch_count")}>
                  Mismatches{" "}
                  {sortKey === "mismatch_count" && (sortAsc ? "▲" : "▼")}
                </th>
              </tr>
            </thead>
            <tbody>
              {pageNodes.map((n) => (
                <tr key={n.node_id}>
                  <td>{n.node_id}</td>
                  <td className="text-dim text-xs">
                    {n.masked_id.substring(0, 12)}...
                  </td>
                  <td>
                    {n.serial_valid ? (
                      n.decoded_serial
                    ) : (
                      <span className="text-purple">
                        {n.decoded_serial} [UNKNOWN]
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`badge ${n.true_status === "RED" ? "bg-red" : n.true_status === "YELLOW" ? "bg-yellow" : "bg-green"}`}
                    >
                      {n.true_status === "RED"
                        ? "THREAT"
                        : n.true_status === "YELLOW"
                          ? "WARN"
                          : "CLEAN"}
                    </span>
                  </td>
                  <td>
                    {n.suspect_score >= 40 ? (
                      <span className="badge bg-red">
                        SUSPECT {n.suspect_score}
                      </span>
                    ) : n.suspect_score >= 20 ? (
                      <span className="badge bg-yellow">
                        WATCH {n.suspect_score}
                      </span>
                    ) : (
                      <span className="badge bg-dim">CLEAR</span>
                    )}
                  </td>
                  <td
                    className={n.mismatch_count > 0 ? "text-red" : "text-dim"}
                  >
                    {n.mismatch_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
