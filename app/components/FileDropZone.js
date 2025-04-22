import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import styles from "./FileDropZone.module.css";

const FILE_ICONS = {
  upload: (
    // Material Symbols: place_item (outlined, black)
    <svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 -960 960 960" width="32" fill="#000"><path d="M200-120q-33 0-56.5-23.5T120-200v-400q0-33 23.5-56.5T200-680h160v80H200v400h560v-400H600v-80h160q33 0 56.5 23.5T840-600v400q0 33-23.5 56.5T760-120H200Zm280-200L320-480l56-56 64 63v-487h80v487l64-63 56 56-160 160Z"/></svg>
  ),
  default: (
    // Material Symbols: place_item (outlined, black)
    <svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 -960 960 960" width="32" fill="#000"><path d="M200-120q-33 0-56.5-23.5T120-200v-400q0-33 23.5-56.5T200-680h160v80H200v400h560v-400H600v-80h160q33 0 56.5 23.5T840-600v400q0 33-23.5 56.5T760-120H200Zm280-200L320-480l56-56 64 63v-487h80v487l64-63 56 56-160 160Z"/></svg>
  ),
  pdf: (
    <svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 0 24 24" width="32" fill="#E53935"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-7V3.5L18.5 9H13z"/></svg>
  ),
  word: (
    <svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 0 24 24" width="32" fill="#1976D2"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-7V3.5L18.5 9H13z"/><text x="7" y="20" fontSize="8" fill="#fff" fontFamily="Arial">W</text></svg>
  ),
  image: (
    <svg xmlns="http://www.w3.org/2000/svg" height="32" viewBox="0 0 24 24" width="32" fill="#43A047"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM5 5h14v10l-4.5-4.5-6 6L5 13.5V5zm0 14v-2l5-5 4.5 4.5 2.5-2.5V19H5z"/></svg>
  ),
};

function getFileTypeIcon(fileName) {
  if (!fileName) return FILE_ICONS.upload;
  const ext = fileName.split('.').pop().toLowerCase();
  if (["jpg", "jpeg", "png", "webp", "bmp", "gif", "tiff"].includes(ext)) return FILE_ICONS.image;
  if (["pdf"].includes(ext)) return FILE_ICONS.pdf;
  if (["doc", "docx"].includes(ext)) return FILE_ICONS.word;
  return FILE_ICONS.default;
}

export default function FileDropZone({ onFileParsed, loading, clearInput }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false); 
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError("");
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    await handleFile(file);
    setParsing(false);
  };

  const handleChange = async (e) => {
    setError("");
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    setParsing(true);
    await handleFile(file);
    setParsing(false);
  };

  function handleClear() {
    setFileName("");
    if (clearInput) clearInput();
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleFile(file) {
    if (file.size > 8 * 1024 * 1024) {
      setError("File too large (max 8MB)");
      return;
    }
    const formData = new FormData();
    formData.append("file", file, file.name || "upload.png");
    try {
      const res = await fetch("/api/parse-file", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else onFileParsed(data.text);
    } catch (e) {
      setError("Failed to parse file");
    }
  }

  function getTruncatedFileName(name) {
    if (!name) return "";
    const ext = name.includes(".") ? "." + name.split(".").pop() : "";
    const base = name.replace(ext, "");
    if (base.length > 22) return base.slice(0, 19) + "..." + ext;
    return base + ext;
  }

  const showLoader = parsing;

  return (
    <div className={styles.dropZoneWrap}>
      <label
        className={
          styles.dropZone +
          (dragActive ? " " + styles.active : "") +
          (showLoader ? " " + styles.loading : "") +
          (fileName ? " " + styles.hasFile : "")
        }
        htmlFor="file-upload"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        style={showLoader ? { opacity: 0.4, pointerEvents: 'none' } : {}}
      >
        <input
          id="file-upload"
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.bmp,.gif,.tiff"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={handleChange}
          disabled={showLoader}
        />
        {showLoader && (
          <span className={styles.loader} style={{ position: 'absolute', top: 4, right: 4 }}>
            <span className="loading-spinner" />
          </span>
        )}
        {fileName && !showLoader && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={e => { e.stopPropagation(); e.preventDefault(); handleClear(); }}
            tabIndex={0}
            aria-label="Clear file"
            style={{ position: 'absolute', top: 4, right: 4 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5L5 15M5 5l10 10" stroke="#888" strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        )}
        <span className={styles.icon} aria-hidden="true">
          {getFileTypeIcon(fileName)}
        </span>
        <span className={styles.text}>
          {fileName
            ? getTruncatedFileName(fileName)
            : (<>
                Drop event file here or <span className={styles.browse} onClick={() => inputRef.current?.click()} style={{ fontWeight: 'bold', textDecoration: 'underline' }}>browse</span>
              </>)}
        </span>
        {!fileName && (
          <span className={styles.supportNote}>
            Only images, PDFs and Docs are supported
          </span>
        )}
      </label>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

FileDropZone.propTypes = {
  onFileParsed: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  clearInput: PropTypes.func,
};
