import React, { useState, useRef } from 'react';
import Webcam from "react-webcam";
import { Client } from "@gradio/client";
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState("analisis");
  const [mode, setMode] = useState("gallery"); 
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [location, setLocation] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Perbaikan: Menghapus setFacingMode agar tidak menyebabkan gagal build di Vercel
  const [facingMode] = useState("environment");
  
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const runPrediction = async (fileBlob) => {
    setLoading(true);
    setPrediction(null);
    try {
      const client = await Client.connect("https://ferdinann-homecheck.hf.space/");
      const result = await client.predict("/handle_upload", { img: fileBlob });
      
      // Simpan data hasil diagnosa (mencegah error object)
      setPrediction(result.data); 
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = async () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;
      setImage(imageSrc);
      const blob = await fetch(imageSrc).then(r => r.blob());
      runPrediction(blob);
    }
  };

  const saveToHistory = () => {
    if (!prediction) return;
    const labelData = prediction[0];
    const statusText = typeof labelData === 'object' ? labelData.label : labelData;
    const newEntry = {
      id: Date.now(),
      waktu: new Date().toLocaleString('id-ID'),
      status: statusText || "Selesai",
      lokasi: location || "Lokasi tidak ditentukan"
    };
    setHistory([newEntry, ...history]);
    alert("Laporan berhasil disimpan!");
  };

  return (
    <div className="min-h-screen bg-[#F9FBFA] text-[#1E292B] font-sans flex flex-col antialiased">
      {/* Header Compact */}
      <nav className="px-8 py-8 w-full max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-800 p-3 rounded-xl shadow-md">🏠</div>
          <h1 className="text-lg font-black tracking-widest uppercase text-emerald-900 leading-none">HomeCheck AI</h1>
        </div>

        <div className="flex bg-slate-200/50 p-1 rounded-xl border border-slate-200">
          <button onClick={() => setActiveTab("analisis")} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === "analisis" ? "bg-white shadow-sm text-emerald-700" : "text-slate-500"}`}>🔍 Analisis</button>
          <button onClick={() => setActiveTab("riwayat")} className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${activeTab === "riwayat" ? "bg-white shadow-sm text-emerald-700" : "text-slate-500"}`}>📜 Riwayat</button>
        </div>
      </nav>

      <main className="flex-grow w-full max-w-6xl mx-auto px-8 py-2">
        {activeTab === "analisis" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 items-start">
            <section className="space-y-6">
              {/* Card Visual Compact */}
              <div className="relative aspect-video rounded-[2rem] bg-white overflow-hidden shadow-lg border-4 border-white ring-1 ring-slate-100 max-w-sm mx-auto lg:mx-0">
                <div className="absolute top-4 right-4 z-10 flex bg-white/90 backdrop-blur p-1 rounded-lg gap-1 border border-slate-100">
                  <button onClick={() => setMode("camera")} className={`px-3 py-1 text-[8px] font-black uppercase rounded ${mode === "camera" ? "bg-emerald-600 text-white" : "text-slate-400"}`}>CAM</button>
                  <button onClick={() => setMode("gallery")} className={`px-3 py-1 text-[8px] font-black uppercase rounded ${mode === "gallery" ? "bg-emerald-600 text-white" : "text-slate-400"}`}>FILE</button>
                </div>

                {mode === "camera" ? (
                  <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode }} className="w-full h-full object-cover" />
                ) : (
                  <div onClick={() => fileInputRef.current.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                    {image ? <img src={image} className="w-full h-full object-cover" alt="Visual" /> : <div className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">+ Pilih Foto</div>}
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setImage(ev.target.result);
                    reader.readAsDataURL(file);
                    runPrediction(file);
                  }
                }} className="hidden" accept="image/*" />
              </div>

              {mode === "camera" && (
                <button onClick={handleCapture} className="w-full max-w-sm bg-slate-900 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-md hover:bg-emerald-700 transition-all">Analisis Foto</button>
              )}

              <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3 max-w-sm">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Titik Lokasi</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lokasi pemeriksaan..." className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium" />
              </div>
            </section>

            <section className="min-h-[400px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-40">
                  <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Menganalisis...</p>
                </div>
              ) : prediction ? (
                <div className="space-y-6 animate-in slide-in-from-right-10 duration-700 flex flex-col items-center text-center">
                  {/* Card Status: Compact & Centered */}
                  <div className="bg-emerald-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden w-full max-w-sm">
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-300">Status Keamanan</span>
                    <h2 className="text-3xl font-light italic mt-2 tracking-tighter uppercase leading-tight">
                      {typeof prediction[0] === 'object' ? prediction[0].label : prediction[0]}
                    </h2>
                  </div>

                  {/* Card Hasil Detail */}
                  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 w-full max-w-sm">
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <span className="h-px w-6 bg-emerald-200"></span>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Diagnosa AI</span>
                      <span className="h-px w-6 bg-emerald-200"></span>
                    </div>
                    <p className="text-slate-600 font-medium leading-[1.7] text-sm italic">
                      {/* Perbaikan: Menghapus backslash pada regex agar lolos build Vercel */}
                      {typeof (prediction[1] || prediction[0]) === 'string' 
                        ? (prediction[1] || prediction[0]).replace(/###|#|\*\*|---/g, '') 
                        : "Analisis teknis diproses."}
                    </p>
                    <button onClick={saveToHistory} className="mt-8 w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-800 transition-all">🚀 Simpan Laporan</button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[3rem] p-10 text-center space-y-4">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] leading-relaxed">Menunggu Input Visual</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          /* Tabel Riwayat */
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-700">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Waktu</th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Kondisi</th>
                    <th className="px-8 py-5 text-[9px] font-black uppercase tracking-widest text-slate-400">Lokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-center lg:text-left">
                  {history.length > 0 ? history.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-8 py-6 font-bold text-slate-600">{item.waktu}</td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status.toLowerCase().includes('rusak') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-slate-500 font-medium italic">{item.lokasi}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" className="px-8 py-20 text-center text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em]">Belum ada riwayat</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full py-8 text-center mt-auto border-t border-slate-50">
        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.5em]">© 2026 HomeCheck AI</p>
      </footer>
    </div>
  );
}

export default App;