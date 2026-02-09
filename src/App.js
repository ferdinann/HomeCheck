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
  const [facingMode] = useState("environment");
  
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const runPrediction = async (fileBlob) => {
    setLoading(true);
    setPrediction(null);
    try {
      const client = await Client.connect("https://ferdinann-homecheck.hf.space/");
      const result = await client.predict("/handle_upload", { img: fileBlob });
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
      status: statusText || "Analisis Selesai",
      lokasi: location || "Lokasi tidak ditentukan"
    };
    setHistory([newEntry, ...history]);
    alert("Laporan berhasil disimpan!");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] text-[#1E292B] font-sans flex flex-col antialiased">
      {/* Navbar: Teks dibuat lebih tajam dengan font-bold */}
      <nav className="px-8 py-10 w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-5">
          <div className="bg-emerald-700 p-4 rounded-2xl shadow-lg">🏠</div>
          <div>
            <h1 className="text-xl font-black tracking-widest uppercase text-emerald-900 leading-none">HomeCheck AI</h1>
            <p className="text-xs font-bold text-slate-500 tracking-wide uppercase mt-1">Smart Diagnostic System</p>
          </div>
        </div>

        <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200">
          <button onClick={() => setActiveTab("analisis")} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === "analisis" ? "bg-white shadow-md text-emerald-700" : "text-slate-500"}`}>🔍 Analisis</button>
          <button onClick={() => setActiveTab("riwayat")} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all ${activeTab === "riwayat" ? "bg-white shadow-md text-emerald-700" : "text-slate-500"}`}>📜 Riwayat</button>
        </div>
      </nav>

      <main className="flex-grow w-full max-w-7xl mx-auto px-8 py-4">
        {activeTab === "analisis" ? (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-16 items-start">
            <section className="space-y-10">
              <div className="relative aspect-video rounded-[2.5rem] bg-white overflow-hidden shadow-xl border-4 border-white ring-1 ring-slate-200">
                <div className="absolute top-6 right-6 z-10 flex bg-white/90 backdrop-blur p-1.5 rounded-xl gap-2 shadow-sm border border-slate-100">
                  <button onClick={() => setMode("camera")} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${mode === "camera" ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>Kamera</button>
                  <button onClick={() => setMode("gallery")} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${mode === "gallery" ? "bg-emerald-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>Galeri</button>
                </div>

                {mode === "camera" ? (
                  <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode }} className="w-full h-full object-cover" />
                ) : (
                  <div onClick={() => fileInputRef.current.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                    {image ? <img src={image} className="w-full h-full object-cover" alt="Visual" /> : <div className="text-slate-400 font-bold text-xs uppercase tracking-widest">+ Pilih Foto Bangunan</div>}
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
                <button onClick={handleCapture} className="w-full bg-[#1A202C] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all active:scale-[0.98]">Ambil & Analisis Visual</button>
              )}

              <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Titik Lokasi Pemeriksaan</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Masukkan alamat atau nama gedung..." className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-4 text-sm font-medium placeholder:text-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all" />
              </div>
            </section>

            <section className="min-h-[500px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-6">
                  <div className="w-14 h-14 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-black text-emerald-900 uppercase tracking-[0.3em] animate-pulse">Memproses Data AI...</p>
                </div>
              ) : prediction ? (
                <div className="animate-in slide-in-from-right-10 duration-700 space-y-10">
                  {/* Card Status: Font diatur agar tegas dan kontras */}
                  <div className="bg-emerald-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden max-w-md mx-auto flex flex-col items-center text-center">
                    {/* Span untuk label kecil, opasitas dihapus agar tajam */}
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-300">
                      Status Keamanan
                    </span>
                    
                    {/* Judul Status: Ukuran dikecilkan ke 3xl dan diposisikan di tengah */}
                    <h2 className="text-3xl font-light italic mt-2 tracking-tighter uppercase leading-tight">
                      {typeof prediction[0] === 'object' ? prediction[0].label : prediction[0]}
                    </h2>
                  </div>

                  {/* Card Analisis: Teks diperbesar dan warna dipertegas */}
                  <div className="bg-white p-10 md:p-14 rounded-[3rem] shadow-sm border border-slate-100 relative">
                    <div className="flex items-center gap-3 mb-8">
                      <span className="h-px w-8 bg-emerald-200"></span>
                      <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest leading-none">Rekomendasi Ahli AI</span>
                    </div>
                    <p className="text-[#4A5568] font-medium leading-[1.8] text-base border-l-4 border-emerald-100 pl-10">
                      {typeof (prediction[1] || prediction[0]) === 'string' 
                        ? (prediction[1] || prediction[0]).replace(/###|#|\*\*|---/g, '') 
                        : "Detail diagnosa teknis tersedia pada lembar riwayat."}
                    </p>
                    <button onClick={saveToHistory} className="mt-12 w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-100 hover:bg-emerald-800 transition-all">🚀 Simpan Hasil Laporan</button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[4rem] px-10 text-center space-y-6">
                  <div className="text-5xl grayscale opacity-20">📊</div>
                  <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em] leading-relaxed">Menunggu Unggahan Visual <br/> Untuk Melakukan Diagnosa</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] shadow-xl border border-slate-200 overflow-hidden animate-in fade-in duration-700">
            <div className="p-10 border-b border-slate-100 flex items-center gap-4">
              <span className="text-2xl">📜</span>
              <h2 className="text-sm font-black uppercase tracking-[0.3em] text-emerald-900">Log Pemeriksaan Tersimpan</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Waktu Diagnosa</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Kondisi</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Titik Lokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.length > 0 ? history.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-10 py-8 text-sm font-bold text-slate-600">{item.waktu}</td>
                      <td className="px-10 py-8">
                        <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status.toLowerCase().includes('rusak') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-sm text-slate-500 font-medium italic">{item.lokasi}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="3" className="px-10 py-24 text-center text-xs font-bold text-slate-300 uppercase tracking-[0.5em]">Belum ada riwayat diagnosa</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full py-14 text-center mt-auto border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em]">
          © 2026 HomeCheck AI • Keamanan Bangunan Cerdas
        </p>
      </footer>
    </div>
  );
}

export default App;