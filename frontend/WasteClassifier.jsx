// src/components/citizen/WasteClassifier.jsx
// AI phân loại rác — Teachable Machine (TensorFlow.js)
// TF và tmImage được load qua index.html (window.tf, window.tmImage)
// KHÔNG dùng API bên ngoài — chạy hoàn toàn trong browser

import { useState, useRef, useEffect } from "react";

const MODEL_URL = "https://teachablemachine.withgoogle.com/models/TV0ou9ZVj/";

const WASTE_INFO = {
  ORGANIC:    { label: "Rác Hữu cơ",   icon: "🌿", color: "#386000", bg: "#b9f474", desc: "Thức ăn thừa, rau củ, trái cây" },
  RECYCLABLE: { label: "Rác Tái chế",  icon: "♻️", color: "#00639a", bg: "#cee5ff", desc: "Giấy, nhựa, thủy tinh, kim loại" },
  HAZARDOUS:  { label: "Rác Nguy hại", icon: "⚠️", color: "#ba1a1a", bg: "#ffdad6", desc: "Pin, hóa chất, thuốc, đèn" },
  ELECTRONIC: { label: "Điện tử",      icon: "📱", color: "#7c3aed", bg: "#ede9fe", desc: "Điện thoại, máy tính, thiết bị" },
  GENERAL:    { label: "Rác thường",   icon: "🗑️", color: "#707a6c", bg: "#dee5d6", desc: "Rác sinh hoạt thông thường" },
};

function mapClassToWasteType(className) {
  const name = className.toUpperCase().trim();
  if (name.includes("ORGANIC")    || name.includes("HỮU CƠ"))   return "ORGANIC";
  if (name.includes("RECYCLABLE") || name.includes("TÁI CHẾ"))  return "RECYCLABLE";
  if (name.includes("HAZARDOUS")  || name.includes("NGUY HẠI")) return "HAZARDOUS";
  if (name.includes("ELECTRONIC") || name.includes("ĐIỆN TỬ"))  return "ELECTRONIC";
  return "GENERAL";
}

export default function WasteClassifier({ onClassified }) {
  const [step, setStep]       = useState("idle");
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");
  const [modelStatus, setModelStatus] = useState("idle");

  const fileRef  = useRef();
  const imgRef   = useRef();
  const modelRef = useRef(null);

  useEffect(() => {
    // Chờ script load xong trong index.html rồi mới init model
    const timer = setTimeout(() => initModel(), 500);
    return () => clearTimeout(timer);
  }, []);

  const initModel = async () => {
    if (modelRef.current || modelStatus === "loading") return;
    if (!window.tmImage) {
      setModelStatus("error");
      setError("Teachable Machine chưa load — kiểm tra kết nối mạng");
      return;
    }
    setModelStatus("loading");
    try {
      modelRef.current = await window.tmImage.load(
          MODEL_URL + "model.json",
          MODEL_URL + "metadata.json"
      );
      setModelStatus("ready");
    } catch (e) {
      console.error("Lỗi load model:", e);
      setModelStatus("error");
      setError("Không thể tải model. Kiểm tra kết nối mạng.");
    }
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Vui lòng chọn file ảnh"); return; }
    if (file.size > 10 * 1024 * 1024)   { setError("Ảnh quá lớn — tối đa 10MB"); return; }
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => { setPreview(ev.target.result); setStep("preview"); };
    reader.readAsDataURL(file);
  };

  const classify = async () => {
    if (!imgRef.current) return;
    setStep("classifying");
    setError("");
    try {
      if (!modelRef.current) {
        await initModel();
        if (!modelRef.current) throw new Error("Model chưa sẵn sàng");
      }
      const predictions = await modelRef.current.predict(imgRef.current);
      const sorted = [...predictions].sort((a, b) => b.probability - a.probability);
      const top    = sorted[0];
      setResult({
        wasteType:      mapClassToWasteType(top.className),
        confidence:     Math.round(top.probability * 100),
        allPredictions: sorted,
      });
      setStep("result");
    } catch (e) {
      console.error("Lỗi classify:", e);
      setError("Phân loại thất bại: " + e.message);
      setStep("preview");
    }
  };

  const confirm = (wasteType) => { onClassified({ wasteType, preview }); setStep("confirmed"); };
  const reset   = () => { setStep("idle"); setPreview(null); setResult(null); setError(""); if (fileRef.current) fileRef.current.value = ""; };

  const C = { primary:"#16a34a", primaryLight:"#dcfce7", outline:"#6b7280", outlineVariant:"#d1fae5", surface:"#f0fdf4", onSurface:"#111827", error:"#dc2626" };

  return (
      <div style={{ marginBottom: 20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
          <label style={{ fontSize:12, fontWeight:600, color:"#374151", textTransform:"uppercase", letterSpacing:"0.05em" }}>🤖 AI Phân loại rác</label>
          {modelStatus==="loading" && <span style={{fontSize:11,color:C.outline}}>⏳ Đang tải model...</span>}
          {modelStatus==="ready"   && <span style={{fontSize:11,color:C.primary,fontWeight:600}}>✓ Sẵn sàng</span>}
          {modelStatus==="error"   && <span style={{fontSize:11,color:C.error}}>✗ Lỗi — bỏ qua, chọn thủ công</span>}
        </div>

        {step==="idle" && (
            <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${C.outlineVariant}`,borderRadius:12,padding:"24px 16px",background:C.surface,textAlign:"center",cursor:"pointer"}}>
              <div style={{fontSize:36,marginBottom:8}}>📷</div>
              <div style={{fontSize:13,fontWeight:600,color:C.onSurface,marginBottom:4}}>Tải ảnh rác lên để AI phân loại</div>
              <div style={{fontSize:12,color:C.outline}}>Chạy trong trình duyệt — không gửi ảnh lên server ngoài</div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
              {error && <div style={{fontSize:12,color:C.error,marginTop:8}}>{error}</div>}
            </div>
        )}

        {step==="preview" && (
            <div style={{border:`1px solid ${C.outlineVariant}`,borderRadius:12,overflow:"hidden"}}>
              <img ref={imgRef} src={preview} alt="preview" crossOrigin="anonymous" style={{width:"100%",maxHeight:220,objectFit:"cover",display:"block"}}/>
              <div style={{padding:"12px 14px",background:C.surface,display:"flex",gap:8,justifyContent:"center"}}>
                <button type="button" onClick={reset} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${C.outlineVariant}`,background:"#fff",color:C.outline,cursor:"pointer",fontSize:12,fontWeight:600}}>🔄 Đổi ảnh</button>
                <button type="button" onClick={classify} disabled={modelStatus!=="ready"} style={{padding:"7px 18px",borderRadius:8,border:"none",background:modelStatus==="ready"?C.primary:"#ccc",color:"#fff",cursor:modelStatus==="ready"?"pointer":"not-allowed",fontSize:13,fontWeight:700}}>
                  {modelStatus==="ready"?"🤖 Phân tích AI":"⏳ Đang tải model..."}
                </button>
              </div>
              {error && <div style={{fontSize:12,color:C.error,padding:"0 14px 10px",textAlign:"center"}}>{error}</div>}
            </div>
        )}

        {step==="classifying" && (
            <div style={{border:`2px solid ${C.outlineVariant}`,borderRadius:12,padding:28,background:C.surface,textAlign:"center"}}>
              <div style={{fontSize:36,marginBottom:12}}>🔍</div>
              <div style={{fontSize:14,fontWeight:700,color:C.primary}}>AI đang phân tích ảnh...</div>
            </div>
        )}

        {step==="result" && result && (()=>{
          const w = WASTE_INFO[result.wasteType]||WASTE_INFO.GENERAL;
          return (
              <div style={{border:`1px solid ${C.outlineVariant}`,borderRadius:12,overflow:"hidden"}}>
                <img src={preview} alt="preview" style={{width:"100%",maxHeight:160,objectFit:"cover",display:"block"}}/>
                <div style={{padding:"14px 16px"}}>
                  <div style={{background:w.bg,border:`2px solid ${w.color}`,borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                      <span style={{fontSize:28}}>{w.icon}</span>
                      <div style={{flex:1}}><div style={{fontWeight:800,fontSize:15,color:w.color}}>{w.label}</div><div style={{fontSize:11,color:w.color+"99"}}>{w.desc}</div></div>
                      <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:20,color:w.color}}>{result.confidence}%</div><div style={{fontSize:10,color:C.outline}}>độ tin cậy</div></div>
                    </div>
                    <div style={{height:6,background:"rgba(0,0,0,0.1)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${result.confidence}%`,background:w.color,borderRadius:3}}/>
                    </div>
                  </div>
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:600,color:C.outline,marginBottom:6,textTransform:"uppercase"}}>Kết quả toàn bộ:</div>
                    {result.allPredictions.map((pred,i)=>{
                      const ww=WASTE_INFO[mapClassToWasteType(pred.className)]||WASTE_INFO.GENERAL;
                      const pct=Math.round(pred.probability*100);
                      return (
                          <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                            <span style={{fontSize:14}}>{ww.icon}</span>
                            <span style={{fontSize:12,fontWeight:i===0?700:400,color:i===0?ww.color:C.outline,minWidth:90}}>{ww.label}</span>
                            <div style={{flex:1,height:5,background:"#e5e7eb",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:ww.color,borderRadius:3}}/></div>
                            <span style={{fontSize:11,color:i===0?ww.color:C.outline,minWidth:32,textAlign:"right",fontWeight:i===0?700:400}}>{pct}%</span>
                          </div>
                      );
                    })}
                  </div>
                  <div style={{fontSize:12,color:C.outline,marginBottom:8,fontWeight:600}}>Xác nhận loại rác để áp dụng vào báo cáo:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    <button type="button" onClick={()=>confirm(result.wasteType)} style={{padding:"8px 16px",borderRadius:8,border:`2px solid ${w.color}`,background:w.bg,color:w.color,fontWeight:700,cursor:"pointer",fontSize:13}}>✓ Đúng, {w.label}</button>
                    {Object.entries(WASTE_INFO).filter(([k])=>k!==result.wasteType).map(([k,v])=>(
                        <button key={k} type="button" onClick={()=>confirm(k)} style={{padding:"6px 11px",borderRadius:8,border:`1px solid ${C.outlineVariant}`,background:"#fff",color:C.onSurface,cursor:"pointer",fontSize:11}}>{v.icon} {v.label}</button>
                    ))}
                  </div>
                  <button type="button" onClick={reset} style={{marginTop:10,background:"none",border:"none",color:C.outline,cursor:"pointer",fontSize:11,textDecoration:"underline"}}>Đổi ảnh khác</button>
                </div>
              </div>
          );
        })()}

        {step==="confirmed" && result && (()=>{
          const w=WASTE_INFO[result.wasteType]||WASTE_INFO.GENERAL;
          return (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:10,background:C.primaryLight,border:`1px solid ${C.outlineVariant}`}}>
                <img src={preview} alt="" style={{width:40,height:40,borderRadius:8,objectFit:"cover",flexShrink:0}}/>
                <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:C.primary}}>✓ AI phân loại: {w.icon} {w.label}</div><div style={{fontSize:11,color:C.outline}}>Loại rác đã được điền vào form bên dưới</div></div>
                <button type="button" onClick={reset} style={{background:"none",border:"none",color:C.outline,cursor:"pointer",fontSize:18}}>✕</button>
              </div>
          );
        })()}
      </div>
  );
}
