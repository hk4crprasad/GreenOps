'use client';
import {useEffect,useRef,useState} from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {useSearchParams} from 'next/navigation';
import {ArrowUpRight,ArrowsOutSimple,ArrowsInSimple,ArrowCounterClockwise,Lightning,Drop,Trash,Plus,Minus,MapPin,CheckCircle,Warning,Leaf,Thermometer} from '@phosphor-icons/react';
import {api,scoped,number,time,type Row,type World} from '../lib/api';
import {allPages,buildingFor,coverage,projected,resources,usage,mapLayers,layerColor,temperature,type MapLayer,type CampusData,type Point,type Resource,type Series} from '../lib/campus';
import './campus.css';

const CampusScene=dynamic(()=>import('./campus-scene'),{ssr:false,loading:()=> <div className="campus-scene campus-scene-loading">Preparing your 3D campus…</div>});
const icons={energy:Lightning,water:Drop,waste:Trash,heat:Thermometer};
const complete=(r:Row)=>['verified','closed'].includes(r.status);

function Trend({points,color}:{points:Point[];color:string}){
  const valid=points.filter(p=>p.value!==null);
  if(valid.length<2)return <p className="campus-note">Not enough readings to draw a trend.</p>;
  const max=Math.max(...valid.map(p=>Number(p.value)),1),min=Math.min(...points.map(p=>new Date(p.time).getTime())),span=Math.max(...points.map(p=>new Date(p.time).getTime()))-min||1;
  const pos=(p:Point)=>`${(new Date(p.time).getTime()-min)/span*280+4},${60-Number(p.value)/max*50}`;
  const segments:Point[][]=[];let segment:Point[]=[];
  points.forEach(p=>{if(p.value===null){if(segment.length)segments.push(segment);segment=[];}else segment.push(p);});if(segment.length)segments.push(segment);
  return <svg viewBox="0 0 288 70" className="campus-trend" role="img" aria-label="Observed resource consumption trend for the selected period"><path d="M4 60H284 M4 35H284 M4 10H284" stroke="#e4e9e3" strokeDasharray="3 5"/>{segments.map((s,i)=><polyline key={i} points={s.map(pos).join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round"/> )}</svg>;
}

export default function Campus({world,hours,start,end,refresh}:{world:World;hours:string;start:string;end:string;refresh:number}){
  const searchParams=useSearchParams();
  const focusZone=searchParams.get('zone')||'',focusLayer=searchParams.get('layer')||'';
  const [data,setData]=useState<CampusData|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[retry,setRetry]=useState(0);
  const [layer,setLayer]=useState<MapLayer>('energy'),[overlay,setOverlay]=useState(true),[selected,setSelected]=useState(''),[proposed,setProposed]=useState(false);
  const [targets,setTargets]=useState({energy:12,water:18,waste:10}),[present,setPresent]=useState(false),[reset,setReset]=useState(0),[zoom,setZoom]=useState(0);
  const isHeat=layer==='heat',resource:Resource=isHeat?'energy':layer as Resource;
  const setResource=(key:Resource)=>setLayer(key);
  const root=useRef<HTMLElement>(null),presentButton=useRef<HTMLButtonElement>(null);
  useEffect(()=>{if(focusZone)setSelected(focusZone);if(focusLayer in mapLayers)setLayer(focusLayer as MapLayer)},[focusZone,focusLayer]);
  useEffect(()=>{
    const abort=new AbortController();setLoading(true);setData(null);setError('');
    const finish=end&&start?new Date(end+'Z').toISOString():world.as_of;
    const begin=end&&start?new Date(start+'Z').toISOString():new Date(new Date(finish).getTime()-Number(hours)*3600000).toISOString();
    const filter={start:begin,end:finish,bucket:(new Date(finish).getTime()-new Date(begin).getTime())/3600000>48?'day':'hour'};
    Promise.all([
      allPages<Row>('/zones',world.id,{},abort.signal),allPages<Row>('/actions',world.id,{},abort.signal),allPages<Row>('/alerts',world.id,{status:'open'},abort.signal),
      ...Object.values(resources).map(r=>allPages<Point>('/metrics/series',world.id,{...filter,metric:r.metric},abort.signal)),
      api<{readings:Row[];error?:string}>(scoped('/environment/state',world.id),{signal:abort.signal}).catch(e=>({readings:[],error:e.message})),
    ]).then(([zones,actions,alerts,energy,water,waste,environment])=>{
      if(abort.signal.aborted)return;
      const zoneRows=(zones.items as Row[]).filter(z=>z.zone_code);
      setData({zones:zoneRows,actions:actions.items as Row[],alerts:alerts.items as Row[],series:{energy:energy as Series,water:water as Series,waste:waste as Series},temperatures:environment.readings||[],heatError:environment.error||''});
      setSelected(old=>zoneRows.some(z=>z.zone_code===old)?old:(zoneRows.find(z=>z.zone_code==='WARD_A')?.zone_code||zoneRows[0]?.zone_code||''));
    }).catch(e=>{if(!abort.signal.aborted)setError(e.message);}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});
    return()=>abort.abort();
  },[world.id,world.as_of,hours,start,end,refresh,retry]);
  useEffect(()=>{
    if(!present)return;
    const old=document.body.style.overflow;document.body.style.overflow='hidden';root.current?.focus();
    const background=Array.from(document.querySelectorAll<HTMLElement>('.sidebar,.topbar,.title-row,.filters,.footer-note'));
    const inert=background.map(el=>el.inert);background.forEach(el=>{el.inert=true;});
    const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setPresent(false);presentButton.current?.focus();}};
    document.addEventListener('keydown',key);
    return()=>{document.body.style.overflow=old;background.forEach((el,i)=>{el.inert=inert[i];});document.removeEventListener('keydown',key);};
  },[present]);
  const r=resources[resource],target=targets[resource],points=data?.series[resource].items||[];
  const zones=data?.zones||[],total=usage(points),zoneTotal=usage(points,selected);
  const zone=zones.find(z=>z.zone_code===selected),building=buildingFor(selected);
  const zonePoints=points.filter(p=>p.zone===selected),zoneActions=data?.actions.filter(a=>a.zone_code===selected)||[],zoneAlerts=data?.alerts.filter(a=>a.zone_code===selected)||[];
  const zoneUsage=zones.map(z=>usage(points,z.zone_code!));
  const percent=data?coverage(zonePoints,data.series[resource].start,data.series[resource].end,1):0;
  const formatted=(value:number|null)=>value===null?'No readings':`${number(value,resource==='waste'?1:0)} ${r.unit}`;
  const reduction=zoneTotal===null?null:zoneTotal*target/100;
  const verified=data?.actions.filter(complete).length||0;
  const thermalRow=data?.temperatures.find(row=>row.zone_code===selected),zoneTemperature=temperature(thermalRow);
  const temperatureValues=zones.map(z=>temperature(data?.temperatures.find(row=>row.zone_code===z.zone_code))).filter((value):value is number=>value!==null);
  const mapProposed=!isHeat&&proposed,scaleMax=isHeat?40:Math.max(...zoneUsage.map(value=>value??0),0),scaleMin=isHeat?20:0;
  const mapMeta=mapLayers[layer];
  const mapValue=(value:number|null)=>value===null?'No readings':`${number(value,isHeat||layer==='waste'?1:0)} ${mapMeta.unit}`;
  const mapMarkers=zones.map((z,i)=>{
    const b=buildingFor(z.zone_code!,i),observed=isHeat?temperature(data?.temperatures.find(row=>row.zone_code===z.zone_code)):usage(points,z.zone_code!);
    const value=mapProposed?projected(observed,target):observed;
    const intensity=value===null?null:Math.max(0,Math.min(1,(value-scaleMin)/(scaleMax-scaleMin||1)));
    return {code:z.zone_code!,label:b.short,value:mapValue(value),intensity,color:layerColor(layer,intensity),alert:data!.alerts.some(a=>a.zone_code===z.zone_code)};
  });

  return <section ref={root} tabIndex={-1} className={'campus '+(present?'campus-presentation':'')} aria-label="Hospital campus resource explorer">
    <header className="campus-heading"><div><span className="campus-kicker"><span/> GREENOPS / SPATIAL INTELLIGENCE</span><h2>One campus. Every resource.</h2><p>Explore the footprint. Find the opportunity. Follow the fix.</p></div><button ref={presentButton} className="campus-present" onClick={()=>setPresent(!present)}>{present?<ArrowsInSimple size={17}/>:<ArrowsOutSimple size={17}/>} {present?'Exit presentation':'Present to jury'}</button></header>
    <div className="campus-context"><span><Leaf size={14}/> Synthetic operating data</span><span>Concept campus · illustrative building locations</span><span>{world.code} · {time(world.as_of)} IST</span></div>
    {loading?<div className="campus-loading" role="status"><span className="campus-loader"/><h3>Connecting the campus</h3><p>Loading authorized zones, resource readings, and recorded fixes…</p></div>:error?<div className="campus-loading" role="alert"><Warning size={30}/><h3>Campus data could not be loaded</h3><p>{error}</p><button onClick={()=>setRetry(v=>v+1)}>Retry campus data</button></div>:!zones.length?<div className="campus-loading"><h3>No reporting zones available</h3><p>This world has no zones visible to your account. Select another authorized world.</p></div>:<>
    <div className="campus-totals">{(Object.keys(resources) as Resource[]).map(key=>{const meta=resources[key],Icon=icons[key],amount=usage(data!.series[key].items),c=coverage(data!.series[key].items,data!.series[key].start,data!.series[key].end,zones.length);return <button key={key} aria-pressed={layer===key} className={'campus-total '+(layer===key?'active':'')} onClick={()=>setResource(key)} style={{'--resource-color':meta.color} as React.CSSProperties}><span><Icon size={19}/>{key==='waste'?'Waste generated':`${meta.label} consumed`}</span><strong>{amount===null?'Unknown':number(amount,key==='waste'?1:0)} <small>{meta.unit}</small></strong><em>{number(c,0)}% coverage <span>Selected period ↗</span></em></button>;})}<div className="campus-total campus-fix-total"><span><CheckCircle size={19}/> Recorded improvements</span><strong>{verified}<small> / {data!.actions.length} verified or closed</small></strong><em>{data!.actions.filter(a=>!complete(a)).length} actions awaiting completion</em></div></div>
    <div className="campus-explorer">
      <div className="campus-map-panel"><div className="campus-map-toolbar"><div className="campus-layer-tabs" role="group" aria-label="Map resource layer">{(Object.keys(mapLayers) as MapLayer[]).map(key=>{const Icon=icons[key];return <button key={key} aria-pressed={layer===key} onClick={()=>setLayer(key)} className={layer===key?'active':''}><Icon size={15}/>{mapLayers[key].label}</button>;})}</div><button className="campus-overlay-toggle" aria-pressed={overlay} onClick={()=>setOverlay(!overlay)}>{overlay?'Overlay on':'Overlay off'}</button><div className="campus-view-tabs" role="group" aria-label="Map comparison mode"><button aria-pressed={!mapProposed} onClick={()=>setProposed(false)} className={!mapProposed?'active':''}>Observed</button><button disabled={isHeat} title={isHeat?'Temperature is an observed snapshot; no reduction scenario applies':undefined} aria-pressed={mapProposed} onClick={()=>setProposed(true)} className={mapProposed?'active':''}>With improvements</button></div></div>
        <div className="campus-map-stage"><div className="campus-map-caption"><span className="campus-kicker">INTERACTIVE 3D CAMPUS</span><strong>{mapMeta.title}</strong><span>{isHeat?'Latest recorded indoor temperature · virtual clock':mapProposed?`Illustrative ${target}% reduction · not measured savings`:'Selected-period totals · colored by reporting zone'}</span></div><div className="campus-compass" aria-hidden="true">N<span>↑</span></div>
          <CampusScene markers={mapMarkers} selected={selected} onSelect={setSelected} overlay={overlay} reset={reset} zoom={zoom}/>
          <div className="campus-map-controls"><button aria-label="Zoom in campus" onClick={()=>setZoom(v=>Math.abs(v)+1)}><Plus size={17}/></button><button aria-label="Zoom out campus" onClick={()=>setZoom(v=>-Math.abs(v)-1)}><Minus size={17}/></button><button aria-label="Reset campus view" onClick={()=>setReset(v=>v+1)}><ArrowCounterClockwise size={17}/></button></div>
          <div className="campus-map-legend" aria-label={`${mapMeta.label} color scale`}><div><strong>{mapMeta.label} · {mapMeta.unit}</strong><span>{isHeat?'Temperature reference scale':'Low → high zone total'}</span></div><i style={{background:`linear-gradient(90deg,${mapMeta.palette.join(',')})`}}/><div><span>{number(scaleMin,0)}{isHeat?' or below':''}</span><span>{number((scaleMin+scaleMax)/2,1)}</span><span>{number(scaleMax,1)}{isHeat?' or above':''}</span></div><p><b/> No readings <em/> Open alert</p><small>{isHeat?'20–40 °C visualization scale; not a safety classification.':'Scale stays fixed to observed totals when comparing improvements.'}</small></div>
          <div className="campus-map-foot"><span>Drag to rotate · Scroll to zoom</span><span>{isHeat?'Zone readings; no readings inferred between buildings.':layer==='waste'?'Generated material · energy/water losses are unmeasured.':'Colored roofs, facades and zone footprints.'}</span></div>
        </div>
        <div className="campus-directory" aria-label="Campus building directory">{zones.map((z,i)=><button key={z.id} onClick={()=>setSelected(z.zone_code!)} aria-pressed={selected===z.zone_code} className={selected===z.zone_code?'active':''}><span>{String(i+1).padStart(2,'0')}</span>{buildingFor(z.zone_code!,i).short}{selected===z.zone_code&&<MapPin size={13}/>}</button>)}</div>
      </div>
      <aside className="campus-inspector" aria-label="Selected building details"><div className="campus-inspector-title"><span className="campus-kicker">BUILDING INSIGHT / {selected}</span><h3>{building.name}</h3><span className={'campus-status '+(zoneAlerts.length?'attention':'')}>{zoneAlerts.length?`${zoneAlerts.length} open alerts`:'No recorded open alerts'}</span></div>
        {isHeat?<><div className="campus-inspector-metric campus-thermal-metric"><span>Recorded indoor temperature · latest snapshot</span><strong>{mapValue(zoneTemperature)}</strong><p>{thermalRow?`Recorded ${time(thermalRow.event_at)} IST`:'No temperature reading available for this building.'}</p>{data!.heatError&&<p role="alert">Temperature source unavailable: {data!.heatError}</p>}<div className="campus-temperature-track" style={{background:`linear-gradient(90deg,${mapMeta.palette.join(',')})`}}>{zoneTemperature!==null&&<i style={{left:`${Math.max(0,Math.min(100,(zoneTemperature-20)/20*100))}%`}}/>}</div><div className="campus-trend-label"><span>20 °C</span><span>30 °C</span><span>40 °C</span></div></div><div className="campus-opportunity"><span className="campus-kicker">THERMAL CONTEXT</span><h4>See warmer and cooler hospital zones</h4><p>The overlay uses the latest recorded indoor temperature in each authorized zone at the virtual clock. Date-range filters apply to the resource maps.</p><div className="campus-thermal-details"><div><span>Humidity</span><strong>{number(thermalRow?.data.humidity_pct)} %</strong></div><div><span>CO₂</span><strong>{number(thermalRow?.data.co2_ppm,0)} ppm</strong></div></div><p className="campus-note">Colors use a fixed 20–40 °C display scale, not clinical thresholds. Gray means no reading. Colored footprints are illustrative; outdoor temperatures are not inferred.</p><Link href="/environment">Inspect environment evidence <ArrowUpRight size={14}/></Link></div></>:<>        <div className="campus-inspector-metric"><span>{r.label} {resource==='waste'?'generated':'consumed'} · selected period</span><strong>{formatted(zoneTotal)}</strong><p>{number(percent,0)}% interval coverage{zone?.data.protected?' · Protected clinical zone':''}</p><Trend points={zonePoints} color={r.color}/><div className="campus-trend-label"><span>Period start</span><span>{zonePoints.length} {data&&(new Date(data.series[resource].end).getTime()-new Date(data.series[resource].start).getTime())/3600000>48?'daily buckets':'hourly readings'}</span><span>Period end</span></div></div>
        <div className="campus-opportunity"><span className="campus-kicker">WHAT COULD WE IMPROVE?</span><h4>{r.intervention}</h4><p>Adjust an illustrative reduction target to show potential impact. Actual avoidable use has not been measured.</p><label htmlFor="campus-target">Reduction assumption <strong>{target}%</strong></label><input id="campus-target" aria-label={`${r.label} reduction assumption`} type="range" min="0" max="30" step="1" value={target} onChange={e=>{setTargets(v=>({...v,[resource]:Number(e.target.value)}));setProposed(true);}}/><div className="campus-comparison"><div><span>Observed</span><b>{formatted(zoneTotal)}</b></div><ArrowUpRight size={18}/><div><span>Illustrative after</span><b>{formatted(projected(zoneTotal,target))}</b></div></div><div className="campus-potential"><span>Potential reduction</span><strong>{formatted(reduction)}</strong></div><p className="campus-note">Observed × {target}% assumption. This preview is not a saved simulation or a verified saving. Clinical loads need a separate engineering assessment.</p><Link href="/simulations">Explore the what-if studio <ArrowUpRight size={14}/></Link></div></>}

      </aside>
    </div>
    <div className="campus-bottom"><section className="campus-work"><div className="campus-section-heading"><div><span className="campus-kicker">FROM INSIGHT TO ACTION</span><h3>What we’re fixing <small>/ {building.short}</small></h3></div><Link href="/actions">Action centre <ArrowUpRight size={15}/></Link></div>{zoneActions.length?<div className="campus-action-list">{zoneActions.map(action=><div className="campus-action" key={action.id}><span className={'campus-action-icon '+(complete(action)?'done':'')}>{complete(action)?<CheckCircle size={19}/>:<WrenchIcon/>}</span><div><strong>{action.name}</strong><p>{action.category||'Operations'} · {action.due_at?`Due ${time(action.due_at)}`:'No due date recorded'}</p></div><span className={'campus-action-status '+(complete(action)?'done':'')}>{action.status.replaceAll('_',' ')}</span></div>)}</div>:<div className="campus-no-actions"><CheckCircle size={22}/><div><strong>No recorded actions for this building</strong><p>Investigate its alerts and record a follow-up in the Action centre.</p></div></div>}{zoneAlerts.length>0&&<details className="campus-alerts"><summary>{zoneAlerts.length} open alerts · inspect evidence</summary>{zoneAlerts.map(a=><div key={a.id}><strong>{a.name}</strong><span>{a.severity} · {time(a.event_at)}</span></div>)}</details>}</section>
      <section className="campus-impact">{isHeat?<><span className="campus-kicker">CAMPUS THERMAL SNAPSHOT</span><h3>{temperatureValues.length?`${number(Math.max(...temperatureValues),1)} °C`:'No readings'}</h3><p>Highest recorded zone temperature. {temperatureValues.length} of {zones.length} authorized zones have a reading.</p><div><span>Coolest {temperatureValues.length?`${number(Math.min(...temperatureValues),1)} °C`:'Unknown'}</span><span>Warmest {temperatureValues.length?`${number(Math.max(...temperatureValues),1)} °C`:'Unknown'}</span></div><p className="campus-note">Latest readings at the world clock; measurement times may differ by zone. Inspect the selected building’s timestamp.</p></>:<><span className="campus-kicker">CAMPUS-WIDE OPPORTUNITY</span><h3>{formatted(total===null?null:total*target/100)}</h3><p>Illustrative {r.label.toLowerCase()} reduction across {zones.length} authorized zones at a {target}% target.</p><div><span>Observed {formatted(total)}</span><span>After {formatted(projected(total,target))}</span></div><div className="campus-impact-bar"><i style={{width:`${100-target}%`}}/></div><span className="campus-note">An estimate for the selected period, not achieved savings.</span></>}</section></div>
    <footer className="campus-source"><span><span className="campus-source-dot"/> Source: scoped GreenOps API · {isHeat?`Latest temperature readings as of ${time(world.as_of)} IST`:`${time(data!.series[resource].start)} – ${time(data!.series[resource].end)} IST`}</span><span>Energy/water losses are unmeasured. Waste = generated material. Geometry is illustrative.</span></footer>
    </>}
  </section>;
}
function WrenchIcon(){return <span aria-hidden="true">↗</span>}
