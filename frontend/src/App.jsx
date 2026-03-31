import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import WasteClassifier from "./components/citizen/WasteClassifier";
import Pagination from "./components/common/Pagination";
import StatusTimeline from "./components/common/StatusTimeline";
import ImageUpload from "./components/common/ImageUpload";

// ── ENTERPRISE DASHBOARD ──────────────────────────────────────────────────────
function EnterpriseDashboard() {
  const [tab,setTab]=useState("pending");
  const [pending,setPending]=useState([]); const [loading,setLoading]=useState(false);
  const [pendingPage,setPendingPage]=useState(0); const [pendingTotal,setPendingTotal]=useState(0);
  const [collectors,setCollectors]=useState([]); const [rules,setRules]=useState([]);
  const [stats,setStats]=useState(null); const [actionId,setActionId]=useState(null);
  const [rejectModal,setRejectModal]=useState(null); const [rejectReason,setRejectReason]=useState("");
  const [assignModal,setAssignModal]=useState(null); const [selectedCollector,setSelectedCollector]=useState("");
  const [ruleForm,setRuleForm]=useState({wasteType:"ORGANIC",basePoints:10,bonusPoints:0,bonusCondition:""});
  const [regForm,setRegForm]=useState({companyName:"",acceptedWasteTypes:"",serviceArea:"",maxCapacityKg:"",address:""});
  const [accepted,setAccepted]=useState([]);

  const fetchPending=useCallback(async(p=0)=>{ setLoading(true); try{ const token=localStorage.getItem("token"); const res=await fetch(`http://localhost:8080/api/requests/pending`,{headers:{Authorization:`Bearer ${token}`}}); const d=await res.json(); setPending(Array.isArray(d)?d:(d.content||[])); setPendingTotal(d.totalPages||0); }catch(e){console.error(e);} finally{setLoading(false);} },[]);
  const fetchCollectors=useCallback(async()=>{ const d=await api("GET","/enterprise/collectors"); setCollectors(Array.isArray(d)?d:[]); },[]);
  const fetchRules=useCallback(async()=>{ const d=await api("GET","/enterprise/point-rules"); setRules(Array.isArray(d)?d:[]); },[]);
  const fetchStats=useCallback(async()=>{ const d=await api("GET","/enterprise/stats"); setStats(d); },[]);
  const fetchAccepted=useCallback(async()=>{ setLoading(true); try{ const token=localStorage.getItem("token"); const res=await fetch(`http://localhost:8080/api/requests/accepted`,{headers:{Authorization:`Bearer ${token}`}}); const d=await res.json(); setAccepted(Array.isArray(d)?d:(d.content||[])); }catch(e){console.error(e);} finally{setLoading(false);} },[]);

  useEffect(()=>{ if(tab==="pending"){setPendingPage(0);fetchPending(0);} else if(tab==="collectors")fetchCollectors(); else if(tab==="rules")fetchRules(); else if(tab==="stats")fetchStats();else if(tab==="accepted")fetchAccepted(); },[tab]);

  const accept=async(id)=>{ setActionId(id); try{ await api("POST",`/requests/${id}/accept`); setPending(p=>p.filter(r=>r.id!==id)); }catch(e){alert(e.message);} finally{setActionId(null);} };
  const reject=async()=>{ if(!rejectReason.trim())return; setActionId(rejectModal); try{ await api("POST",`/requests/${rejectModal}/reject`,{reason:rejectReason}); setPending(p=>p.filter(r=>r.id!==rejectModal)); setRejectModal(null); setRejectReason(""); }catch(e){alert(e.message);} finally{setActionId(null);} };
  const assign=async()=>{ if(!selectedCollector)return; setActionId(assignModal); try{ await api("POST",`/requests/${assignModal}/assign`,{collectorId:parseInt(selectedCollector)}); setPending(p=>p.filter(r=>r.id!==assignModal)); setAssignModal(null); }catch(e){alert(e.message);} finally{setActionId(null);} };
  const saveRule=async()=>{ try{ await api("POST","/enterprise/point-rules",ruleForm); fetchRules(); setRuleForm({wasteType:"ORGANIC",basePoints:10,bonusPoints:0,bonusCondition:""}); }catch(e){alert(e.message);} };

  const tabs=[{id:"register",label:"Đăng ký DN"},{id:"pending",label:"Chờ xử lý"},{id:"accepted",label:"Đã nhận"},{id:"collectors",label:"Collectors"},{id:"rules",label:"Cấu hình điểm"},{id:"stats",label:"Thống kê"}];

  return <Layout tab={tab} setTab={setTab} tabs={tabs}>
    {rejectModal&&<Modal title={`Từ chối #${rejectModal}`} onClose={()=>{setRejectModal(null);setRejectReason("");}}>
      <Input label="Lý do từ chối *" textarea value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Nhập lý do..."/>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn v="muted" onClick={()=>{setRejectModal(null);setRejectReason("");}}>Hủy</Btn><Btn v="danger" onClick={reject}>Từ chối</Btn></div>
    </Modal>}
    {assignModal&&<Modal title={`Giao Collector — Báo cáo #${assignModal}`} onClose={()=>setAssignModal(null)}>
      <Select label="Chọn Collector" value={selectedCollector} onChange={e=>setSelectedCollector(e.target.value)} options={[{v:"",l:"-- Chọn collector --"},...collectors.map(c=>({v:String(c.id),l:c.fullName+" — "+c.email}))]}/>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn v="muted" onClick={()=>setAssignModal(null)}>Hủy</Btn><Btn onClick={assign} disabled={!selectedCollector}>Giao việc</Btn></div>
    </Modal>}

    {tab==="register"&&<div style={{maxWidth:560}}>
      <Card>
        <h3 style={{margin:"0 0 16px",fontSize:16}}>Đăng ký thông tin doanh nghiệp</h3>
        <Input label="Tên công ty *" value={regForm.companyName} onChange={e=>setRegForm(p=>({...p,companyName:e.target.value}))} placeholder="Công ty TNHH ABC"/>
        <Input label="Loại rác tiếp nhận *" value={regForm.acceptedWasteTypes} onChange={e=>setRegForm(p=>({...p,acceptedWasteTypes:e.target.value}))} placeholder="RECYCLABLE,ORGANIC,HAZARDOUS"/>
        <Input label="Khu vực phục vụ" value={regForm.serviceArea} onChange={e=>setRegForm(p=>({...p,serviceArea:e.target.value}))} placeholder="TP.HCM, Bình Dương"/>
        <Input label="Công suất tối đa (kg)" type="number" value={regForm.maxCapacityKg} onChange={e=>setRegForm(p=>({...p,maxCapacityKg:e.target.value}))} placeholder="1000"/>
        <Input label="Địa chỉ" value={regForm.address} onChange={e=>setRegForm(p=>({...p,address:e.target.value}))} placeholder="123 Nguyễn Huệ, Q.1"/>
        <Btn style={{width:"100%",padding:12}} onClick={async()=>{
          try{
            await api("POST","/enterprise/register",{...regForm,maxCapacityKg:parseInt(regForm.maxCapacityKg)||null});
            alert("Đăng ký thành công! Chờ Admin verify.");
            setTab("pending");
          }catch(e){alert(e.message);}
        }}>Đăng ký doanh nghiệp</Btn>
      </Card>
    </div>}

    {tab==="pending"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}><span style={{color:C.muted,fontSize:14}}>{pending.length} yêu cầu chờ</span><Btn v="ghost" onClick={fetchPending}>Làm mới</Btn></div>
      {loading?<p style={{color:C.muted}}>Đang tải...</p>:<div style={{display:"flex",flexDirection:"column",gap:12}}>
        {pending.length===0&&<Card style={{textAlign:"center",padding:40}}><p style={{color:C.muted}}>Không có yêu cầu đang chờ.</p></Card>}
        {pending.map(r=><Card key={r.id} style={{display:"flex",gap:16,alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}><span style={{fontWeight:700}}>#{r.id}</span><WasteBadge t={r.wasteType}/><StatusBadge s={r.status}/></div>
            <div style={{fontSize:13,color:C.muted}}> {r.citizen?.fullName} •  {r.addressText||`${r.latitude}, ${r.longitude}`}</div>
            {r.description&&<div style={{fontSize:13,marginTop:4}}>{r.description}</div>}
          </div>
          <div style={{display:"flex",gap:8,flexShrink:0,flexWrap:"wrap"}}>
            {r.status==="PENDING"&&<><Btn onClick={()=>accept(r.id)} disabled={actionId===r.id}>{actionId===r.id?<Spin/>:"Nhận"}</Btn><Btn v="danger" onClick={()=>setRejectModal(r.id)}>Từ chối</Btn></>}
            {r.status==="ACCEPTED"&&<Btn v="blue" onClick={()=>{setAssignModal(r.id);fetchCollectors();}}>Giao việc</Btn>}
          </div>
        </Card>)}
      </div>}
      <Pagination page={pendingPage} totalPages={pendingTotal} onPageChange={p=>{setPendingPage(p);fetchPending(p);}}/>
    </div>}

    {tab==="accepted"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <span style={{color:C.muted,fontSize:14}}>{accepted.length} báo cáo đã nhận</span>
        <Btn v="ghost" onClick={fetchAccepted}>Làm mới</Btn>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {accepted.length===0&&<Card style={{textAlign:"center",padding:40}}><p style={{color:C.muted}}>Không có báo cáo đã nhận.</p></Card>}
        {accepted.map(r=><Card key={r.id} style={{display:"flex",gap:16,alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}><span style={{fontWeight:700}}>#{r.id}</span><WasteBadge t={r.wasteType}/><StatusBadge s={r.status}/></div>
            <div style={{fontSize:13,color:C.muted}}> {r.citizen?.fullName} •  {r.addressText||`${r.latitude}, ${r.longitude}`}</div>
            {r.description&&<div style={{fontSize:13,marginTop:4}}>{r.description}</div>}
          </div>
          <Btn v="blue" onClick={()=>{setAssignModal(r.id);fetchCollectors();}}>Giao việc</Btn>
        </Card>)}
      </div>
    </div>}

    {tab==="collectors"&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h3 style={{margin:0,fontSize:16}}>Collectors</h3>
        <Btn v="primary" onClick={async()=>{
          const id=prompt("Nhập ID của Collector:");
          if(!id)return;
          try{
            const token=localStorage.getItem("token");
            const res=await fetch(`http://localhost:8080/api/enterprise/collectors/${id}`,{
              method:"POST",
              headers:{Authorization:`Bearer ${token}`}
            });
            if(res.ok){alert("Đã thêm Collector!");fetchCollectors();}
            else{const d=await res.json();alert(d.message||"Lỗi");}
          }catch(e){alert(e.message);}
        }}>Thêm Collector</Btn>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {collectors.map(c=><Card key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px"}}>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{c.fullName}</div><div style={{fontSize:12,color:C.muted}}>{c.email} • {c.phone}</div></div>
          <span style={{padding:"3px 10px",borderRadius:20,background:c.active?C.accentLt:"#fee2e2",color:c.active?C.accent:C.danger,fontSize:12,fontWeight:700}}>{c.active?"Hoạt động":"Vô hiệu"}</span>
          <Btn v="danger" style={{fontSize:11,padding:"4px 10px"}} onClick={async()=>{
            if(!window.confirm(`Xóa ${c.fullName}?`))return;
            try{await api("DELETE",`/enterprise/collectors/${c.id}`);fetchCollectors();}
            catch(e){alert(e.message);}
          }}>Xóa</Btn>
        </Card>)}
        {collectors.length===0&&<Card style={{textAlign:"center",padding:32}}>
          <p style={{color:C.muted}}>Chưa có collector nào.</p>
        </Card>}
      </div>
    </div>}

    {tab==="rules"&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
      <div>
        <h3 style={{margin:"0 0 16px",fontSize:16}}>Cập nhật quy tắc</h3>
        <Card>
          <Select label="Loại rác" value={ruleForm.wasteType} onChange={e=>setRuleForm(p=>({...p,wasteType:e.target.value}))} options={Object.entries(WASTE).map(([v,{l}])=>({v,l:l}))}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Điểm cơ bản" type="number" value={ruleForm.basePoints} onChange={e=>setRuleForm(p=>({...p,basePoints:parseInt(e.target.value)}))}/>
            <Input label="Điểm thưởng" type="number" value={ruleForm.bonusPoints} onChange={e=>setRuleForm(p=>({...p,bonusPoints:parseInt(e.target.value)}))}/>
          </div>
          <Input label="Điều kiện thưởng" value={ruleForm.bonusCondition} onChange={e=>setRuleForm(p=>({...p,bonusCondition:e.target.value}))} placeholder="VD: Phân loại đúng"/>
          <Btn style={{width:"100%"}} onClick={saveRule}>Lưu quy tắc</Btn>
        </Card>
      </div>
      <div>
        <h3 style={{margin:"0 0 16px",fontSize:16}}>Quy tắc hiện tại</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {rules.map(r=><Card key={r.id} style={{padding:"12px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><WasteBadge t={r.wasteType}/><span style={{marginLeft:"auto",fontWeight:800,color:C.accent}}>+{r.basePoints}</span></div>
            {r.bonusPoints>0&&<div style={{fontSize:12,color:C.muted}}>Thưởng: +{r.bonusPoints} - {r.bonusCondition}</div>}
          </Card>)}
          {rules.length===0&&<Card style={{textAlign:"center",padding:24}}><p style={{color:C.muted}}>Chưa có quy tắc nào.</p></Card>}
        </div>
      </div>
    </div>}

    {tab==="stats"&&stats&&<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16,marginBottom:24}}>
        {Object.entries(stats.byStatus||{}).map(([s,n])=><Card key={s} style={{textAlign:"center"}}>
          <StatusBadge s={s}/><div style={{fontSize:28,fontWeight:800,marginTop:8}}>{n}</div>
        </Card>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <Card><h4 style={{margin:"0 0 12px"}}>Theo loại rác đã thu gom</h4>
          {Object.entries(stats.byWasteType||{}).map(([t,n])=><div key={t} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
            <WasteBadge t={t}/><div style={{flex:1,height:8,background:C.bg,borderRadius:4,overflow:"hidden"}}><div style={{height:"100%",background:C.accent,width:`${Math.min(100,(n/Math.max(...Object.values(stats.byWasteType)))*100)}%`,transition:"width 0.5s"}}/></div><span style={{fontWeight:700,minWidth:24,textAlign:"right"}}>{n}</span>
          </div>)}
        </Card>
        <Card><h4 style={{margin:"0 0 12px"}}>30 ngày gần nhất</h4>
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {Object.entries(stats.last30Days||{}).slice(-7).map(([d,n])=><div key={d} style={{display:"flex",alignItems:"center",gap:8,fontSize:12}}>
              <span style={{color:C.muted,minWidth:80}}>{d.slice(5)}</span><div style={{flex:1,height:6,background:C.bg,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",background:C.blue,width:`${Math.min(100,(n/Math.max(...Object.values(stats.last30Days)))*100)}%`}}/></div><span style={{fontWeight:700}}>{n}</span>
            </div>)}
          </div>
        </Card>
      </div>
    </div>}
  </Layout>;
}

