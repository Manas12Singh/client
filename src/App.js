import React, { useState } from "react";
import axios from "axios";

function App() {
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [tokens, setTokens] = useState([]);
  const [selected, setSelected] = useState({ token: null, value: null });

  const handleCompile = async () => {
    try {
      const response = await axios.post("http://localhost:5000/compile", { code });
      setOutput(response.data.output);
      // Fetch tokens.json after successful compile
      const tokensRes = await axios.get("http://localhost:5000/tokens");
      setTokens(tokensRes.data);
    } catch (error) {
      setOutput("Error: " + (error.response?.data?.error || error.message));
      setTokens([]);
    }
  };

  const handleCodeChange = async (e) => {
    setCode(e.target.value);
    setOutput("");
    setTokens([]);
    setSelected({ token: null, value: null });
    // Delete tokens.json on code update
    await axios.post("http://localhost:5000/reset-tokens");
  };

  // Get unique token types and values for dropdowns
  const tokenTypes = Array.from(new Set(tokens.map(t => t.token)));
  const valuesForType = selected.token
    ? Array.from(new Set(tokens.filter(t => t.token === selected.token).map(t => t.value)))
    : [];

  // Dropdown handlers
  const handleTokenTypeChange = (e) => {
    const token = e.target.value;
    setSelected({ token, value: null });
  };
  const handleValueChange = (e) => {
    const value = e.target.value;
    setSelected((prev) => ({ ...prev, value }));
  };

  // Highlight logic for code: highlight all tokens with selected value (and type if selected)
  const renderCode = () => {
    if (!tokens.length) return code;
    let elements = [];
    let last = 0;
    tokens.forEach((t, i) => {
      if (t.start > last) {
        elements.push(code.slice(last, t.start));
      }
      const isHighlighted =
        (selected.value && t.value === selected.value && (!selected.token || t.token === selected.token));
      elements.push(
        <span
          key={i}
          style={{ background: isHighlighted ? "yellow" : "inherit", cursor: "pointer" }}
          onClick={() => {
            setSelected({ token: t.token, value: t.value });
          }}
        >
          {code.slice(t.start, t.end)}
        </span>
      );
      last = t.end;
    });
    if (last < code.length) elements.push(code.slice(last));
    return elements;
  };

  return (
    <div style={{ padding: 20 }}>
      <textarea
        value={code}
        onChange={handleCodeChange}
        rows={10}
        cols={60}
        placeholder="Enter C code here..."
      />
      <br />
      <button onClick={handleCompile}>Compile</button>
      <pre>{output}</pre>
      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
        {/* Token Dropdowns */}
        {tokens.length > 0 && (
          <div style={{ minWidth: 250 }}>
            <h3>Tokens</h3>
            <div style={{ marginBottom: 10 }}>
              <label>Token Type: </label>
              <select value={selected.token || ''} onChange={handleTokenTypeChange}>
                <option value='' disabled>Select token type</option>
                {tokenTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            {selected.token && (
              <div style={{ marginBottom: 10 }}>
                <label>Value: </label>
                <select value={selected.value || ''} onChange={handleValueChange}>
                  <option value='' disabled>Select value</option>
                  {valuesForType.map((val) => (
                    <option key={val} value={val}>{val}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
        {/* Code Preview */}
        <div style={{ flex: 1 }}>
          <h3>Code Preview</h3>
          <pre style={{ background: "#f4f4f4", padding: 10, minHeight: 100, borderRadius: 4 }}>
            {tokens.length > 0 ? renderCode() : code}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default App;
