"use client";
import { useState } from "react";
import Image from "next/image";
import { Dialog } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, X, Play } from "lucide-react";
import { words } from "@/lib/club";
import type { GalleryItem, Locale } from "@/types";
export function MediaGallery({items,locale}:{items:GalleryItem[];locale:Locale}) {
  const [selected,setSelected]=useState(0);
  const [open,setOpen]=useState(false);
  const current=items[selected];
  const move=(step:number)=>setSelected(i=>(i+step+items.length)%items.length);
  return <Dialog.Root open={open} onOpenChange={setOpen}><div className="club-gallery-grid">{items.map((item,index)=><Dialog.Trigger key={item.id} className="club-gallery-item" onClick={()=>setSelected(index)} aria-label={words(locale,"Ouvrir : ","Open: ")+item.title[locale]}><div className="gallery-image"><Image src={item.image} alt="" fill sizes="(min-width:768px) 33vw, 50vw"/>{item.type==="video"&&<Play className="absolute bottom-3 right-3 text-white"/>}</div><h3>{item.title[locale]}</h3><small>{item.image.startsWith("http")?words(locale,"Illustration · Unsplash","Illustration · Unsplash"):"Ninety One Foot Academy"}</small></Dialog.Trigger>)}</div>
  <Dialog.Portal><Dialog.Backdrop className="club-dialog-backdrop"/><Dialog.Popup className="club-lightbox" aria-describedby={undefined} onKeyDown={e=>{if(e.key==="ArrowRight"){e.preventDefault();move(1);}if(e.key==="ArrowLeft"){e.preventDefault();move(-1);}}}>
    <div className="club-lightbox-top"><Dialog.Title>{current?.title[locale]}</Dialog.Title><Dialog.Close className="club-icon-button" aria-label={words(locale,"Fermer la galerie","Close gallery")}><X/></Dialog.Close></div>
    {current&&<div className="club-lightbox-photo">{current.type==="video"&&current.videoUrl?<iframe key={current.id} src={current.videoUrl} title={current.title[locale]} allowFullScreen className="h-full w-full" allow="fullscreen"/>:<Image src={current.image} alt={current.title[locale]} fill sizes="90vw"/>}</div>}
    <div className="club-lightbox-controls"><button className="club-icon-button" onClick={()=>move(-1)} aria-label={words(locale,"Média précédent","Previous media")}><ChevronLeft/></button><span role="status" aria-live="polite">{selected+1} / {items.length}</span><button className="club-icon-button" onClick={()=>move(1)} aria-label={words(locale,"Média suivant","Next media")}><ChevronRight/></button></div>
  </Dialog.Popup></Dialog.Portal></Dialog.Root>;
}
