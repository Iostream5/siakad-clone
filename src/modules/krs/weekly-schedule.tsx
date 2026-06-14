"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Clock, MapPin, User } from "lucide-react";

interface ScheduleItem {
  id: string;
  hari: string;
  jam_mulai: string;
  jam_selesai: string;
  ruangan: string;
  mata_kuliah: {
    nama: string;
    kode: string;
  };
  dosen: {
    users: {
      full_name: string;
    };
  };
}

interface WeeklyScheduleProps {
  scheduleItems: ScheduleItem[];
}

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const JAM_LIST = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

// Helper to convert time string "HH:mm" to decimal hour (e.g. "08:30" -> 8.5)
function timeToDecimal(timeStr: string) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m / 60);
}

export function WeeklySchedule({ scheduleItems }: WeeklyScheduleProps) {
  if (!scheduleItems || scheduleItems.length === 0) {
     return (
         <Card className="p-10 text-center text-slate-500 border-dashed">
             <CalendarIcon className="h-10 w-10 mx-auto text-slate-300 mb-4" />
             <p>Belum ada jadwal kelas. KRS Anda mungkin belum disetujui atau belum diisi.</p>
         </Card>
     );
  }

  return (
    <Card className="overflow-hidden bg-white border-slate-200 shadow-sm">
       <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
           <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-600" />
              Jadwal Mingguan Anda
           </h3>
       </div>
       <div className="overflow-x-auto">
          <div className="min-w-[800px] relative p-4">
             {/* Header Hari */}
             <div className="grid grid-cols-7 gap-2 mb-2 pl-16">
                {HARI_LIST.map(hari => (
                   <div key={hari} className="text-center font-bold text-sm text-slate-700 bg-slate-100 rounded-lg py-2">
                      {hari}
                   </div>
                ))}
             </div>

             <div className="relative">
                 {/* Garis Jam dan Label */}
                 {JAM_LIST.map((jam, i) => (
                    <div key={jam} className="flex relative items-center h-[60px]">
                        <div className="w-16 pr-4 text-right text-xs font-medium text-slate-400">
                           {jam}
                        </div>
                        <div className="flex-1 border-t border-slate-100 absolute left-16 right-0 top-1/2" />
                    </div>
                 ))}

                 {/* Event Grid */}
                 <div className="absolute inset-0 left-16 grid grid-cols-6 gap-2">
                     {HARI_LIST.map(hari => {
                         const items = scheduleItems.filter(i => i.hari.toLowerCase() === hari.toLowerCase());
                         return (
                            <div key={`col-${hari}`} className="relative h-[660px]"> {/* 11 slots * 60px */}
                                {items.map((item, idx) => {
                                   const startDec = timeToDecimal(item.jam_mulai);
                                   const endDec = timeToDecimal(item.jam_selesai);

                                   // offset from 07:00
                                   const startOffset = (startDec - 7) * 60;
                                   const duration = (endDec - startDec) * 60;

                                   // Generate a consistent color based on course code
                                   const colors = [
                                       "bg-blue-100 text-blue-800 border-blue-200",
                                       "bg-emerald-100 text-emerald-800 border-emerald-200",
                                       "bg-violet-100 text-violet-800 border-violet-200",
                                       "bg-amber-100 text-amber-800 border-amber-200",
                                       "bg-rose-100 text-rose-800 border-rose-200",
                                       "bg-cyan-100 text-cyan-800 border-cyan-200"
                                   ];

                                   const colorClass = colors[item.mata_kuliah.kode.length % colors.length];

                                   return (
                                       <div
                                           key={`${item.id}-${idx}`}
                                           className={`absolute left-0 right-0 rounded-lg p-2 border shadow-sm flex flex-col justify-between overflow-hidden hover:z-10 transition-all hover:scale-105 ${colorClass}`}
                                           style={{ top: `${startOffset + 30}px`, height: `${duration}px` }}
                                           title={`${item.mata_kuliah.nama} (${item.jam_mulai}-${item.jam_selesai})`}
                                       >
                                           <div>
                                               <p className="text-[10px] font-bold tracking-tight leading-tight line-clamp-2 mb-1">{item.mata_kuliah.nama}</p>
                                               <div className="flex items-center gap-1 text-[9px] opacity-80">
                                                  <Clock className="h-2.5 w-2.5" /> {item.jam_mulai} - {item.jam_selesai}
                                               </div>
                                           </div>
                                           <div className="mt-1 flex justify-between items-end">
                                               <div className="flex items-center gap-1 text-[9px] font-medium opacity-80">
                                                  <MapPin className="h-2.5 w-2.5" /> {item.ruangan}
                                               </div>
                                               <div className="h-4 w-4 bg-white/40 rounded-full flex items-center justify-center backdrop-blur-sm" title={item.dosen?.users?.full_name}>
                                                  <User className="h-2.5 w-2.5" />
                                               </div>
                                           </div>
                                       </div>
                                   );
                                })}
                            </div>
                         );
                     })}
                 </div>
             </div>
          </div>
       </div>
    </Card>
  );
}

function CalendarIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
