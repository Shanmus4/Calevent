import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import styles from "./FileDropZone.module.css";

export default function FileDropZone({ onFileParsed, loading }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
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
    await handleFile(file);
  };

  const handleChange = async (e) => {
    setError("");
    const file = e.target.files[0];
    if (!file) return;
    await handleFile(file);
  };

  async function handleFile(file) {
    if (file.size > 8 * 1024 * 1024) {
      setError("File too large (max 8MB)");
      return;
    }
    const formData = new FormData();
    // Always include the filename for best backend compatibility
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

  return (
    <div className={styles.dropZoneWrap}>
      <label
        className={
          styles.dropZone +
          (dragActive ? " " + styles.active : "") +
          (loading ? " " + styles.loading : "")
        }
        htmlFor="file-upload"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id="file-upload"
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.bmp,.gif,.tiff"
          ref={inputRef}
          style={{ display: "none" }}
          onChange={handleChange}
          disabled={loading}
        />
        <span className={styles.icon}>📄</span>
        <span className={styles.text}>
          Drag & drop PDF, image, or Word doc here, or <span className={styles.browse} onClick={() => inputRef.current?.click()}>browse</span>
        </span>
        {loading && <span className={styles.loadingMsg}>Parsing file...</span>}
      </label>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

FileDropZone.propTypes = {
  onFileParsed: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
