'use client';
import {useEffect,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {buildingFor,campusBuildings,type Building} from '../lib/campus';

type Marker={code:string;label:string;value:string;intensity:number|null;color:string;alert:boolean};
type Props={markers:Marker[];selected:string;onSelect:(code:string)=>void;overlay:boolean;reset:number;zoom:number};

export default function CampusScene({markers,selected,onSelect,overlay,reset,zoom}:Props){
  const host=useRef<HTMLDivElement>(null),labels=useRef(new Map<string,HTMLButtonElement>());
  const [rotating,setRotating]=useState(true);
  const current=useRef({markers,selected,onSelect,overlay,rotating});
  current.current={markers,selected,onSelect,overlay,rotating};
  const controller=useRef<{reset:()=>void;zoom:(value:number)=>void}> (null);
  const [failed,setFailed]=useState(false);
  const codes=markers.map(m=>m.code).join('|');
  useEffect(()=>{
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    const change=()=>setRotating(!preference.matches);
    change();preference.addEventListener('change',change);
    return()=>preference.removeEventListener('change',change);
  },[]);
  useEffect(()=>{
    if(!host.current)return;
    const el=host.current;
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch{setFailed(true);return;}
    setFailed(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.setClearColor('#e5eee6');
    renderer.domElement.setAttribute('aria-label','Interactive 3D hospital campus. Drag to orbit; scroll to zoom. Use the building buttons to inspect resources.');
    renderer.domElement.setAttribute('role','img');
    el.prepend(renderer.domElement);
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(38,1,.1,500);
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;controls.enablePan=false;
    controls.autoRotateSpeed=.25; // One gentle revolution every four minutes.
    let interacting=false,pauseUntil=0;
    const pause=()=>{pauseUntil=performance.now()+5000;};
    const interactionStart=()=>{interacting=true;pause();};
    const interactionEnd=()=>{interacting=false;pause();};
    controls.addEventListener('start',interactionStart);controls.addEventListener('end',interactionEnd);
    // Hold labels still while pointing, touching, or using keyboard controls.
    el.addEventListener('pointermove',pause);el.addEventListener('pointerdown',pause);el.addEventListener('focusin',pause);
    controls.minDistance=75;controls.maxDistance=280;
    controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI/2.4;
    let redraw=true;
    const home=()=>{camera.position.set(88,94,116).multiplyScalar(Math.max(1,Math.min(1.5,1.05/(el.clientWidth/el.clientHeight))));controls.target.set(0,0,0);controls.update();redraw=true;};home();
    controller.current={reset:home,zoom:value=>{camera.position.sub(controls.target).multiplyScalar(value>0?.82:1.22).clampLength(75,280).add(controls.target);controls.update();redraw=true;}};
    scene.add(new THREE.HemisphereLight('#ffffff','#8caa8e',2.8));
    const sun=new THREE.DirectionalLight('#fff4d9',3.4);sun.position.set(-40,85,35);sun.castShadow=true;
    sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-80,right:80,top:80,bottom:-80,near:1,far:180});
    sun.shadow.normalBias=.08;scene.add(sun);
    const materials=new Map<string,THREE.MeshStandardMaterial>();
    const mat=(c:string)=>{if(!materials.has(c))materials.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.8}));return materials.get(c)!;};
    const cubeGeometry=new THREE.BoxGeometry(1,1,1);
    function box(x:number,y:number,z:number,w:number,h:number,d:number,c:string,parent:THREE.Object3D=scene){
      const m=new THREE.Mesh(cubeGeometry,mat(c));m.position.set(x,y,z);m.scale.set(w,h,d);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
    }
    function cylinder(x:number,y:number,z:number,r:number,h:number,c:string,segments=24){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
    function textPlane(text:string,x:number,y:number,z:number,w:number,h:number,background='#f3f4e9',ink='#34574e'){
      const c=document.createElement('canvas');c.width=768;c.height=128;const ctx=c.getContext('2d')!;
      ctx.fillStyle=background;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 40px sans-serif';ctx.fillText(text,384,64);
      const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
      const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);scene.add(m);
    }
    box(0,-1.25,0,86,2,87,'#b5c5ac');box(0,-.2,0,85,.25,86,'#aabea0');
    // Perimeter boulevard, internal drives, and pale pedestrian paths.
    for(const x of [-36,36])box(x,0,0,5,.14,80,'#7f8e8a');
    for(const z of [-36,37])box(0,.01,z,77,.14,5,'#7f8e8a');
    box(-8,.04,5,4,.12,61,'#8d9991');box(14,.04,8,4,.12,60,'#8d9991');
    box(1,.05,-5,64,.12,3,'#dfe0ca');box(1,.05,23,62,.12,3,'#dfe0ca');
    for(let i=-32;i<=32;i+=6){for(const z of [-36,37])box(i,.12,z,2,.03,.14,'#e5e7d8');for(const x of [-36,36])box(x,.12,i,.14,.03,2,'#e5e7d8');}
    for(let i=0;i<6;i++)box(-8,.14,33+i*.55,3,.03,.24,'#ffffff');
    textPlane('GREENOPS  ·  HOSPITAL CAMPUS',0,.16,40.5,31,2.2,'#aabea0');
    textPlane('MAIN ENTRANCE  ↑',-8,.2,29,10,1.7,'#8d9991','#ffffff');
    const clickable:THREE.Object3D[]=[];
    const halos=new Map<string,THREE.Mesh>();
    const surfaces=new Map<string,{material:THREE.MeshStandardMaterial;original:THREE.Color}[]>();
    const roofs=new Map<string,THREE.Mesh>();
    const glowCanvas=document.createElement('canvas');glowCanvas.width=128;glowCanvas.height=128;
    const glowContext=glowCanvas.getContext('2d')!,gradient=glowContext.createRadialGradient(64,64,0,64,64,64);
    gradient.addColorStop(0,'rgba(255,255,255,0.85)');gradient.addColorStop(.45,'rgba(255,255,255,0.65)');gradient.addColorStop(1,'rgba(255,255,255,0)');
    glowContext.fillStyle=gradient;glowContext.fillRect(0,0,128,128);
    const glowTexture=new THREE.CanvasTexture(glowCanvas);
    const anchors=new Map<string,THREE.Vector3>();
    const selectedRing=new THREE.Mesh(new THREE.RingGeometry(1,1.035,64),new THREE.MeshBasicMaterial({color:'#194f3b',side:THREE.DoubleSide}));selectedRing.rotation.x=-Math.PI/2;selectedRing.position.y=.24;scene.add(selectedRing);
    const extra=current.current.markers.filter(m=>!campusBuildings.some(b=>b.code===m.code)).map((m,i)=>buildingFor(m.code,i));
    function hospital(b:Building){
      const authorized=current.current.markers.some(m=>m.code===b.code);
      const group=new THREE.Group();scene.add(group);
      const {x,z,w,d,h}=b;
      box(x,.15,z,w+2,.25,d+2,'#e8e8d9',group);
      box(x,h/2+.4,z,w,h,d,authorized?'#f4f0df':'#d6dace',group);
      // Blue curtain-wall glazing, with visible mullions and white floor slabs.
      box(x,h/2,z+d/2+.04,w-1.5,h-1.6,.12,'#548b96',group);
      box(x+w/2+.04,h/2,z,.12,h-1.6,d-1.5,'#608b90',group);
      for(let level=2;level<h;level+=2.3){box(x,level,z+d/2+.16,w,.23,.3,'#e9eadc',group);box(x+w/2+.16,level,z,.3,.23,d,'#e9eadc',group);}
      for(let col=-w/2+1;col<w/2;col+=1.5)box(x+col,h/2,z+d/2+.15,.13,h-1,.16,'#c2d3cc',group);
      for(let col=-d/2+1;col<d/2;col+=1.7)box(x+w/2+.15,h/2,z+col,.16,h-1,.13,'#c2d3cc',group);
      box(x,h+.6,z,w+.7,.5,d+.7,'#fffdf0',group);
      box(x,h+.88,z,w-1.1,.1,d-1.1,'#b9c3b2',group);
      box(x+w*.22,h+1.5,z-d*.18,w*.3,1.3,d*.3,'#e4e5d8',group);
      for(let i=0;i<3;i++){box(x-w*.3+i*1.8,h+1,z+d*.13,1.4,.18,d*.38,'#365e73',group);}
      box(x,2.2,z+d/2+1.5,5,.4,3.2,'#f4f0df',group);box(x,1,z+d/2+.25,2,2,.22,'#244f60',group);
      if(b.code==='ICU'){box(x,h+1.1,z,3,.12,.8,'#bd5b50',group);box(x,h+1.12,z,.8,.12,3,'#bd5b50',group);}
      if(authorized){
        const tinted:{material:THREE.MeshStandardMaterial;original:THREE.Color}[]=[];
        group.traverse(m=>{m.userData.code=b.code;if(m instanceof THREE.Mesh){
          clickable.push(m);
          if(m.scale.y>h*.6){const material=(m.material as THREE.MeshStandardMaterial).clone();m.material=material;tinted.push({material,original:material.color.clone()});}
        }});surfaces.set(b.code,tinted);
        const halo=new THREE.Mesh(new THREE.PlaneGeometry(w*2.5,d*2.5),new THREE.MeshBasicMaterial({map:glowTexture,transparent:true,opacity:.8,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.position.set(x,.34,z);scene.add(halo);halos.set(b.code,halo);
        const roof=new THREE.Mesh(new THREE.PlaneGeometry(w-.6,d-.6),new THREE.MeshBasicMaterial({transparent:true,opacity:.82,depthWrite:false}));roof.rotation.x=-Math.PI/2;roof.position.set(x,h+.96,z);scene.add(roof);roofs.set(b.code,roof);
        anchors.set(b.code,new THREE.Vector3(x,h+4,z));
      }
    }
    [...campusBuildings,...extra].forEach(hospital);
    // Skybridge, utilities tanks, parking, and the central healing garden.
    box(-6,5,-17,9,2.5,3,'#789f9e');box(-6,6.5,-17,9,.35,3.2,'#f1efdf');
    for(const x of [-28,-23])cylinder(x,2.5,29,1.5,4.7,'#c7d9d6');
    box(3,.1,30,17,.18,9,'#89938b');
    for(let i=0;i<7;i++){box(-4+i*2.4,.22,30,.1,.03,8,'#ecebda');for(const z of [27.5,32.5]){box(-3+i*2.4,.65,z,1.4,.7,2.7,['#e6e5db','#45615f','#e3bf78','#8daaa9'][i%4]);box(-3+i*2.4,1.1,z,1.15,.35,1.2,'#789899');}}
    textPlane('P',4,.25,30,2,1.5,'#89938b','#ffffff');
    cylinder(2,.18,9,9,.25,'#e7e6d0',64);cylinder(2,.35,9,7.8,.2,'#8eae80',64);
    const pond=cylinder(2,.49,9,4,.14,'#74babc',48);pond.scale.z=.7;
    cylinder(2,.7,9,1,.45,'#e9e8d4');cylinder(2,1.3,9,.22,.8,'#8ed6d7');
    for(const x of [-3,6])box(x,.7,16,2,.4,.8,'#b9a783');
    textPlane('HEALING GARDEN',2,.25,20,13,1.5,'#aabea0');
    cylinder(25,.3,-27,5.3,.3,'#8c9a90',48);textPlane('H',25,.48,-27,4,3.4,'#8c9a90','#ffffff');
    // Ambulance at the clinical approach.
    box(6,.9,-7.4,3.3,1.5,1.7,'#f9f7e8');box(7.6,1.5,-7.4,.7,.5,1.5,'#5e8d98');box(5.5,1.75,-7.4,.6,.15,.6,'#c86551');
    const treeGeo=new THREE.IcosahedronGeometry(1,1);
    function tree(x:number,z:number,size:number){
      box(x,1,z,.28,2,.28,'#867c58');
      const crown=new THREE.Mesh(treeGeo,mat(['#6d8e57','#7d9d66','#587d4e'][Math.abs(Math.round(x+z))%3]));crown.position.set(x,2.8*size,z);crown.scale.set(1.5*size,2*size,1.5*size);crown.castShadow=true;scene.add(crown);
    }
    for(let i=-39;i<=39;i+=4.5){tree(i,-40,1+(Math.sin(i)*.15));tree(i,43,.8);tree(-41,i,1);tree(41,i,.9);}
    for(const [x,z] of [[-29,-28],[-15,-28],[-3,-29],[13,-29],[-31,-4],[-28,19],[-17,19],[30,27],[18,26],[-2,18],[8,17],[-3,2],[8,2],[31,-20],[19,3]])tree(x,z,.8);
    const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let down={x:0,y:0};
    const pointerDown=(e:PointerEvent)=>{down={x:e.clientX,y:e.clientY};};
    const pointerUp=(e:PointerEvent)=>{
      if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;
      const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);
      const hit=raycaster.intersectObjects(clickable,false)[0];if(hit)current.current.onSelect(hit.object.userData.code);
    };
    const lost=(e:Event)=>{e.preventDefault();setFailed(true);};
    renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('webglcontextlost',lost);
    let previousWidth=el.clientWidth;
    const resize=()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();if((w<500)!==(previousWidth<500))home();previousWidth=w;redraw=true;};
    const observer=new ResizeObserver(resize);observer.observe(el);resize();
    let frame=0,lastFrame=performance.now();const v=new THREE.Vector3();let previousProps:typeof current.current|null=null;
    function render(){
      const now=performance.now(),delta=Math.min((now-lastFrame)/1000,.1);lastFrame=now;
      controls.autoRotate=current.current.rotating&&!interacting&&now>=pauseUntil&&!document.hidden;
      const moved=controls.update(delta);
      // Keep orbit damping responsive without redrawing a static campus every frame.
      if(!redraw&&!moved&&previousProps===current.current){frame=requestAnimationFrame(render);return;}
      redraw=false;previousProps=current.current;
      const {markers,selected,overlay}=current.current;
      const b=[...campusBuildings,...extra].find(b=>b.code===selected);selectedRing.visible=!!b;
      if(b){selectedRing.position.set(b.x,.32,b.z);selectedRing.scale.set(Math.max(b.w,b.d)*.8,Math.max(b.w,b.d)*.8,1);}
      markers.forEach(m=>{
        const halo=halos.get(m.code);if(halo){halo.visible=overlay&&m.intensity!==null;const material=halo.material as THREE.MeshBasicMaterial;material.color.set(m.color);material.opacity=.6+(m.intensity??0)*.35;}
        const roof=roofs.get(m.code);if(roof){roof.visible=overlay;(roof.material as THREE.MeshBasicMaterial).color.set(m.color);}
        surfaces.get(m.code)?.forEach(({material,original})=>{material.color.copy(original);material.emissive.set('#000000');if(overlay){material.color.lerp(new THREE.Color(m.color),.78);material.emissive.set(m.color).multiplyScalar(.12);}});
        const label=labels.current.get(m.code),anchor=anchors.get(m.code);
        if(label&&anchor){v.copy(anchor).project(camera);label.style.transform=`translate(-50%,-100%) translate(${(v.x*.5+.5)*el.clientWidth}px,${(-v.y*.5+.5)*el.clientHeight}px)`;label.style.visibility=v.z<1?'visible':'hidden';label.style.zIndex=m.code===selected?'3':'2';}
      });
      renderer.render(scene,camera);frame=requestAnimationFrame(render);
    }render();
    return()=>{
      cancelAnimationFrame(frame);observer.disconnect();
      controls.removeEventListener('start',interactionStart);controls.removeEventListener('end',interactionEnd);
      el.removeEventListener('pointermove',pause);el.removeEventListener('pointerdown',pause);el.removeEventListener('focusin',pause);
      controls.dispose();controller.current=null;
      renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('webglcontextlost',lost);
      const geometries=new Set<THREE.BufferGeometry>(),mats=new Set<THREE.Material>();
      scene.traverse(obj=>{if(obj instanceof THREE.Mesh){geometries.add(obj.geometry);for(const material of Array.isArray(obj.material)?obj.material:[obj.material])mats.add(material);}});
      geometries.forEach(g=>g.dispose());mats.forEach(m=>{if('map' in m)(m.map as THREE.Texture|null)?.dispose();m.dispose();});renderer.dispose();renderer.domElement.remove();
    };
  },[codes]);
  useEffect(()=>{controller.current?.reset();},[reset]);
  useEffect(()=>{if(zoom)controller.current?.zoom(zoom>0?1:-1);},[zoom]);
  return <div className="campus-scene" ref={host}>
    {!failed&&<button className="campus-rotation" aria-label={rotating?'Pause auto rotation':'Resume auto rotation'} aria-pressed={rotating} onClick={()=>setRotating(value=>!value)}>{rotating?'Ⅱ Pause rotation':'↻ Resume rotation'}</button>}
    {!failed&&markers.map(m=><button key={m.code} ref={el=>{if(el)labels.current.set(m.code,el);else labels.current.delete(m.code);}} style={{borderTop:`3px solid ${m.color}`}} data-overlay-color={m.color} data-intensity={m.intensity??'unknown'} className={'campus-marker '+(selected===m.code?'is-selected':'')} aria-label={`Inspect ${m.label}`} aria-pressed={selected===m.code} onClick={()=>onSelect(m.code)}><span>{m.alert&&<i/>}{m.label}</span><strong>{m.value}</strong></button>)}
    {failed&&<div className="campus-fallback"><strong>3D rendering is unavailable in this browser.</strong><p>Select a building below to explore all resource data and improvements.</p>{markers.map(m=><button key={m.code} onClick={()=>onSelect(m.code)}>{m.label} · {m.value}</button>)}</div>}
  </div>;
}
