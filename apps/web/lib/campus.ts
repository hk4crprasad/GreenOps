import {api, scoped, type Row} from './api';

export const resources = {
  energy: {label: 'Energy', metric: 'energy.interval_kwh', unit: 'kWh', color: '#c58c28', target: 12, intervention: 'Optimize nonessential lighting and HVAC schedules'},
  water: {label: 'Water', metric: 'water.interval_l', unit: 'L', color: '#2589ae', target: 18, intervention: 'Inspect leaks and improve nonclinical water efficiency'},
  waste: {label: 'Waste', metric: 'waste.generated_kg', unit: 'kg', color: '#a170aa', target: 10, intervention: 'Reduce material use and improve waste segregation'},
} as const;
export type Resource = keyof typeof resources;
export type Point = {time: string; zone: string; value: number | null; rows: number; valid_rows: number};
export type Series = {items: Point[]; start: string; end: string; truncated: boolean};
export type CampusData = {zones: Row[]; actions: Row[]; alerts: Row[]; series: Record<Resource, Series>};
export type Building = {code: string; name: string; short: string; x: number; z: number; w: number; d: number; h: number};
const buildings: Building[] = [
  {code:'WARD_A', name:'Inpatient ward A', short:'Ward A', x:-18,z:-16,w:17,d:11,h:13},
  {code:'ICU', name:'Intensive care unit', short:'ICU', x:4,z:-19,w:13,d:11,h:10},
  {code:'WARD_B', name:'Inpatient ward B', short:'Ward B', x:24,z:-9,w:11,d:15,h:15},
  {code:'OPD', name:'Outpatient department', short:'Outpatients', x:-22,z:8,w:16,d:11,h:7},
  {code:'ADMIN', name:'Administration', short:'Admin', x:24,z:16,w:11,d:10,h:7},
  {code:'SERVICES', name:'Utilities & services', short:'Utilities', x:-23,z:29,w:13,d:8,h:5},
];
export function buildingFor(code: string, index = 0): Building {
  return buildings.find(b => b.code === code) || {code,name:code.replaceAll('_',' '),short:code.replaceAll('_',' '),x:-25+(index%5)*13,z:-39-Math.floor(index/5)*11,w:9,d:7,h:5};
}
export const campusBuildings = buildings;

// Follow every page: campus totals must not silently stop at 500 observations.
export async function allPages<T>(path: string, world: string, filter: Record<string,string|number>, signal: AbortSignal): Promise<{items:T[]; [key:string]:any}> {
  const items:T[]=[];
  for(let offset=0;;offset+=500){
    const page=await api(scoped(path,world,{...filter,limit:500,offset}),{signal});
    items.push(...page.items);
    if(!page.truncated)return {...page,items};
    if(!page.items.length)throw new Error('The data source returned an incomplete page. Refresh to retry.');
  }
}
export function usage(points: Point[], code?: string): number | null {
  const values=points.filter(p=>(!code||p.zone===code)&&p.value!==null);
  return values.length ? values.reduce((sum,p)=>sum+Number(p.value),0) : null;
}
export function coverage(points: Point[], start: string, end: string, zones: number): number {
  const expected=(new Date(end).getTime()-new Date(start).getTime())/3600000*zones;
  return expected>0 ? Math.min(100,points.reduce((sum,p)=>sum+p.valid_rows,0)/expected*100) : 0;
}
export function projected(value:number|null, percent:number){return value===null?null:value*(1-percent/100)}
