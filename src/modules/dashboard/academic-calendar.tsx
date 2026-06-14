"use client";
import React from "react";

import { useState } from "react";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KalenderEvent } from "@/lib/admin/kalender";
import { addKalenderEventAction, deleteKalenderEventAction } from "@/actions/kalender";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AcademicCalendarProps {
  events: KalenderEvent[];
  isAdmin: boolean;
  tahunAkademikId: string;
}

const categoryColors: Record<string, string> = {
  "KRS": "bg-blue-100 text-blue-700 border-blue-200",
  "UTS": "bg-amber-100 text-amber-700 border-amber-200",
  "UAS": "bg-rose-100 text-rose-700 border-rose-200",
  "LIBUR": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "WISUDA": "bg-purple-100 text-purple-700 border-purple-200",
  "LAINNYA": "bg-slate-100 text-slate-700 border-slate-200"
};

export function AcademicCalendar({ events, isAdmin, tahunAkademikId }: AcademicCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [open, setOpen] = useState(false);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getEventsForDay = (date: Date) => {
    return events.filter(e => {
        const start = parseISO(e.tanggal_mulai);
        const end = parseISO(e.tanggal_selesai);
        return date >= start && date <= end;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline"  onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="text-xl font-bold text-slate-900 min-w-[200px] text-center">
            {format(currentDate, 'MMMM yyyy', { locale: id })}
          </h2>
          <Button variant="outline"  onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>

        {isAdmin && (
           <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                 <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
                    <Plus className="h-4 w-4" /> Tambah Event
                 </Button>
              </DialogTrigger>
              <DialogContent>
                 <DialogHeader>
                    <DialogTitle>Tambah Jadwal Akademik</DialogTitle>
                 </DialogHeader>
                 <form action={(formData) => {
                     addKalenderEventAction(formData);
                     setOpen(false);
                 }} className="space-y-4">
                    <input type="hidden" name="tahun_akademik_id" value={tahunAkademikId} />
                    <div>
                       <Label>Judul Event</Label>
                       <Input name="judul" required placeholder="Cth: Masa Pengisian KRS" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <Label>Mulai</Label>
                          <Input type="date" name="tanggal_mulai" required />
                       </div>
                       <div>
                          <Label>Selesai</Label>
                          <Input type="date" name="tanggal_selesai" required />
                       </div>
                    </div>
                    <div>
                       <Label>Kategori</Label>
                       <Select name="kategori" defaultValue="KRS">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                             <SelectItem value="KRS">KRS / Akademik</SelectItem>
                             <SelectItem value="UTS">Ujian Tengah Semester</SelectItem>
                             <SelectItem value="UAS">Ujian Akhir Semester</SelectItem>
                             <SelectItem value="LIBUR">Hari Libur</SelectItem>
                             <SelectItem value="WISUDA">Wisuda</SelectItem>
                             <SelectItem value="LAINNYA">Lainnya</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                    <div>
                       <Label>Deskripsi (Opsional)</Label>
                       <Input name="deskripsi" />
                    </div>
                    <div className="flex justify-end pt-4">
                       <Button type="submit" className="bg-indigo-600">Simpan Event</Button>
                    </div>
                 </form>
              </DialogContent>
           </Dialog>
        )}
      </div>

      <Card className="overflow-hidden bg-white border-slate-200">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => (
            <div key={day} className="p-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[120px] divide-y divide-x divide-slate-100">
          {days.map((day, idx) => {
             // Fill empty spaces for the first week
             if (idx === 0) {
                 const emptyDays = Array.from({ length: day.getDay() }).map((_, i) => (
                     <div key={`empty-${i}`} className="bg-slate-50/50" />
                 ));
                 return (
                    <React.Fragment key="first-week">
                        {emptyDays}
                        <CalendarDay
                           date={day}
                           events={getEventsForDay(day)}
                           isCurrentMonth={isSameMonth(day, currentDate)}
                        />
                    </React.Fragment>
                 )
             }
             return (
                 <CalendarDay
                    key={day.toISOString()}
                    date={day}
                    events={getEventsForDay(day)}
                    isCurrentMonth={isSameMonth(day, currentDate)}
                 />
             )
          })}
        </div>
      </Card>

      <div className="bg-white p-6 rounded-xl border border-slate-200">
         <h3 className="font-bold text-slate-900 mb-4">Agenda Mendatang</h3>
         <div className="space-y-3">
             {events.filter(e => parseISO(e.tanggal_selesai) >= new Date()).slice(0, 5).map(e => (
                <div key={e.id} className="flex items-start justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start gap-4">
                        <div className={`mt-1 h-3 w-3 rounded-full ${categoryColors[e.kategori]?.split(' ')[0]}`} />
                        <div>
                            <p className="font-semibold text-slate-900">{e.judul}</p>
                            <p className="text-sm text-slate-500">
                                {format(parseISO(e.tanggal_mulai), 'd MMM', {locale: id})} - {format(parseISO(e.tanggal_selesai), 'd MMM yyyy', {locale: id})}
                            </p>
                        </div>
                    </div>
                    {isAdmin && (
                        <form action={deleteKalenderEventAction}>
                            <input type="hidden" name="id" value={e.id} />
                            <Button variant="ghost" size="sm" className="text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </form>
                    )}
                </div>
             ))}
             {events.length === 0 && <p className="text-sm text-slate-500 italic">Belum ada agenda bulan ini.</p>}
         </div>
      </div>
    </div>
  );
}

function CalendarDay({ date, events, isCurrentMonth }: { date: Date, events: KalenderEvent[], isCurrentMonth: boolean }) {
    const isToday = isSameDay(date, new Date());

    return (
        <div className={`p-2 border-slate-100 relative ${!isCurrentMonth ? 'bg-slate-50/50 text-slate-400' : 'bg-white'} ${isToday ? 'bg-indigo-50/30' : ''}`}>
            <div className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                {format(date, 'd')}
            </div>
            <div className="mt-1 space-y-1 overflow-y-auto max-h-[70px] hide-scrollbar">
                {events.map((e, i) => (
                    <div
                        key={`${e.id}-${i}`}
                        className={`text-[10px] px-1.5 py-0.5 rounded border truncate font-medium ${categoryColors[e.kategori] || categoryColors["LAINNYA"]}`}
                        title={e.judul}
                    >
                        {e.judul}
                    </div>
                ))}
            </div>
        </div>
    )
}
