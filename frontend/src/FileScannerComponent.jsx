import React, { useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axios from 'axios';

export default function FileScannerComponent() {
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const html5Qrcode = new Html5Qrcode("qr-file-reader");

    try {
      const decodedText = await html5Qrcode.scanFile(file, true);
      const response = await axios.post('http://localhost:8000/api/attendance/scan', { qr_hash: decodedText });
      setScanResult(response.data);
      setErrorMsg(null);
    } catch (err) {
      setScanResult(null);
      setErrorMsg(err.response?.data?.detail || "Could not read QR code from image.");
    }
  };

  return (
    <div style={{ maxWidth: '450px', margin: '40px auto', textAlign: 'center', padding: '20px', border: '1px solid #ddd', borderRadius: '10px', fontFamily: 'sans-serif' }}>
      <h2>Upload QR Code Image</h2>
      <input type="file" accept="image/*" onChange={handleFileUpload} style={{ marginBottom: '20px' }} />
      <div id="qr-file-reader" style={{ display: 'none' }}></div>

      {scanResult && (
        <div style={{ padding: '15px', backgroundColor: '#dcfce7', border: '1px solid #16a34a', borderRadius: '8px' }}>
          <h3 style={{ color: '#15803d', margin: 0 }}>{scanResult.student_name}</h3>
          <p style={{ margin: '5px 0' }}>ID: {scanResult.student_number}</p>
          <strong>Status: {scanResult.mode} ({scanResult.status})</strong>
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '15px', backgroundColor: '#fee2e2', border: '1px solid #dc2626', borderRadius: '8px', color: '#b91c1c' }}>
          <p>{errorMsg}</p>
        </div>
      )}
    </div>
  );
}