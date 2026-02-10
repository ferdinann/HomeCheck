import React, { useState, useRef } from 'react';
import Webcam from "react-webcam";
import { Client } from "@gradio/client";
import EXIF from 'exif-js';
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

  // --- FUNGSI LOKASI & GEOCODING ---

  const fetchAddress = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      return data.display_name.split(',').slice(0, 3).join(',');
    } catch (error) {
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  };

  const getLiveLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject("GPS tidak didukung");
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const addr = await fetchAddress(pos.coords.latitude, pos.coords.longitude);
        resolve(addr);
      }, (err) => reject(err));
    });
  };

  const getExifLocation = (file) => {
    return new Promise((resolve) => {
      EXIF.getData(file, function() {
        const lat = EXIF.getTag(this, "GPSLatitude");
        const lon = EXIF.getTag(this, "GPSLongitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef") || "N";
        const lonRef = EXIF.getTag(this, "GPSLongitudeRef") || "E";

        if (lat && lon) {
          const toDecimal = (gps, ref) => {
            let d = gps[0].numerator / gps[0].denominator;
            let m = gps[1].numerator / gps[1].denominator;
            let s = gps[2].numerator / gps[2].denominator;
            let dec = d + m / 60 + s / 3600;
            return ref === "S" || ref === "W" ? dec * -1 : dec;
          };
          resolve({ lat: toDecimal(lat, latRef), lon: toDecimal(lon, lonRef) });
        } else {
          resolve(null);
        }
      });
    });
  };

  // --- LOGIKA UTAMA ---

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
      setLocation("Mendeteksi lokasi...");
      
      try {
        const addr = await getLiveLocation();
        setLocation(addr);
      } catch {
        setLocation("Lokasi tidak terdeteksi");
      }

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
    <div className="min-h-screen bg-[#F4F7F5] text-[#1E292B] font-sans flex flex-col antialiased">
      {/* Header */}
      <nav className="px-6 py-6 w-full max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-900 p-2.5 rounded-xl shadow-lg shadow-emerald-900/20 text-xl">🏠</div>
          <h1 className="text-xl font-black tracking-tighter text-emerald-950 uppercase">HomeCheck<span className="text-emerald-600">AI</span></h1>
        </div>

        <div className="flex bg-slate-200/60 p-1.5 rounded-2xl border border-white/50 backdrop-blur-sm">
          <button onClick={() => setActiveTab("analisis")} className={`px-8 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === "analisis" ? "bg-white shadow-md text-emerald-800" : "text-slate-500"}`}>Analisis</button>
          <button onClick={() => setActiveTab("riwayat")} className={`px-8 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === "riwayat" ? "bg-white shadow-md text-emerald-800" : "text-slate-500"}`}>Riwayat</button>
        </div>
      </nav>

      <main className="flex-grow w-full max-w-5xl mx-auto px-6 py-4">
        {activeTab === "analisis" ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            
            {/* Sisi Kiri: Input */}
            <section className="flex flex-col gap-6">
              <div className="relative aspect-video rounded-[2.5rem] bg-white overflow-hidden shadow-2xl shadow-emerald-900/5 border-[6px] border-white transition-all">
                <div className="absolute top-5 right-5 z-20 flex bg-white/80 backdrop-blur-md p-1.5 rounded-xl gap-1 border border-white shadow-sm">
                  <button onClick={() => setMode("camera")} className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg ${mode === "camera" ? "bg-emerald-800 text-white shadow-md" : "text-slate-400"}`}>CAM</button>
                  <button onClick={() => setMode("gallery")} className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg ${mode === "gallery" ? "bg-emerald-800 text-white shadow-md" : "text-slate-400"}`}>FILE</button>
                </div>

                {mode === "camera" ? (
                  <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode }} className="w-full h-full object-cover" />
                ) : (
                  <div onClick={() => fileInputRef.current.click()} className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors group">
                    {image ? <img src={image} className="w-full h-full object-cover" alt="Visual" /> : 
                      <div className="text-center">
                        <div className="text-slate-200 text-5xl mb-2 group-hover:scale-110 transition-transform">+</div>
                        <div className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">Pilih Foto Properti</div>
                      </div>
                    }
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setImage(ev.target.result);
                    reader.readAsDataURL(file);
                    
                    setLocation("Membaca metadata lokasi...");
                    const coords = await getExifLocation(file);
                    if (coords) {
                      const addr = await fetchAddress(coords.lat, coords.lon);
                      setLocation(addr);
                    } else {
                      setLocation("Lokasi tidak ada di metadata file");
                    }
                    runPrediction(file);
                  }
                }} className="hidden" accept="image/*" />
              </div>

              {mode === "camera" && (
                <button onClick={handleCapture} className="w-full bg-emerald-950 text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-800 transition-all">Ambil & Analisis</button>
              )}

              <div className="p-6 bg-white rounded-[2rem] border border-white shadow-xl shadow-emerald-900/5 space-y-3">
                <label className="text-[10px] font-black text-emerald-800/40 uppercase tracking-[0.2em] ml-1">Titik Lokasi Pemeriksaan</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lokasi otomatis atau isi manual..." className="w-full bg-slate-50/80 border-2 border-transparent focus:border-emerald-100 focus:bg-white transition-all rounded-2xl px-5 py-4 text-sm font-semibold outline-none" />
              </div>
            </section>

            {/* Sisi Kanan: Output */}
            <section className="flex flex-col h-full">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full bg-white rounded-[2.5rem] border border-white shadow-xl">
                  <div className="w-12 h-12 border-[3px] border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                  <p className="mt-4 text-[11px] font-black uppercase tracking-[0.3em] text-emerald-800 animate-pulse">Scanning Struktur...</p>
                </div>
              ) : prediction ? (
                <div className="flex flex-col gap-6 h-full animate-in fade-in zoom-in duration-500">
                  <div className="bg-emerald-950 text-white p-8 rounded-[2.5rem] shadow-2xl text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-400/80 mb-4 block">Hasil Klasifikasi</span>
                    <h2 className="text-5xl font-black tracking-tighter uppercase leading-tight">
                      {typeof prediction[0] === 'object' ? prediction[0].label : prediction[0]}
                    </h2>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-white flex-grow flex flex-col">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-px flex-grow bg-slate-100"></div>
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Diagnosa AI</span>
                      <div className="h-px flex-grow bg-slate-100"></div>
                    </div>
                    <div className="bg-slate-50/50 p-6 rounded-2xl flex-grow overflow-y-auto">
                      <p className="text-slate-700 font-semibold leading-relaxed text-sm">
                        {(prediction[1] || prediction[0]).toString().replace(/###|#|\*\*|---/g, '')}
                      </p>
                    </div>
                    <button onClick={saveToHistory} className="mt-8 w-full bg-emerald-600 text-white py-4.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-emerald-700 transition-all">Simpan Laporan</button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-slate-200/60 rounded-[3rem] p-12 text-center opacity-60">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.4em]">Menunggu Input Visual</p>
                </div>
              )}
            </section>
          </div>
        ) : (
          /* Riwayat Table */
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Waktu</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-10 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Lokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {history.length > 0 ? history.map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="px-10 py-6 font-bold text-slate-600 text-sm">{item.waktu}</td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.status.toLowerCase().includes('rusak') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-slate-500 font-semibold italic text-sm">{item.lokasi}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan="3" className="px-8 py-32 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">Belum ada riwayat</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full py-10 text-center">
        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.6em]">© 2026 HomeCheck Intelligent Systems</p>
      </footer>
    </div>
  );
}

export default App;