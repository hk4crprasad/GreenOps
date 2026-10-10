import type {ReactNode} from 'react';
import './globals.css';
import Product from '../components/product';
export const metadata={title:'Hospital GreenOps AI',description:'Aggregate hospital operations and sustainability decision platform'};
export default function Layout({children}:{children:ReactNode}){return <html lang="en"><body><Product/>{children}</body></html>}
