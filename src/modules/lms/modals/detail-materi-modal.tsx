"use client";

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Play, ExternalLink, FileType2, Download } from "lucide-react";

interface DetailMateriModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    judul: string;
    deskripsi?: string | null;
    file_url?: string | null;
    file_type?: string | null;
    is_visible: boolean;
    created_at: string;
  } | null;
}

function getContentTypeConfig(fileType: string | null | undefined) {
  const type = fileType?.toLowerCase();

  switch (type) {
    case 'pdf':
    case 'doc':
      return {
        icon: FileText,
        buttonIcon: Download,
        label: 'Unduh File',
        isExternal: false
      };
    case 'video':
      return {
        icon: Play,
        buttonIcon: ExternalLink,
        label: 'Tonton Video',
        isExternal: true
      };
    case 'link':
      return {
        icon: ExternalLink,
        buttonIcon: ExternalLink,
        label: 'Buka Link',
        isExternal: true
      };
    default:
      return {
        icon: FileType2,
        buttonIcon: Download,
        label: 'Unduh File',
        isExternal: false
      };
  }
}

export function DetailMateriModal({ isOpen, onClose, item }: DetailMateriModalProps) {
  if (!item) return null;

  const config = getContentTypeConfig(item.file_type);
  const IconComponent = config.icon;
  const ButtonIconComponent = config.buttonIcon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-[1.5rem] border-none shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100 shrink-0">
              <IconComponent className="h-6 w-6" />
            </div>
            <div className="text-left">
              <DialogTitle className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight">
                {item.judul}
              </DialogTitle>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  Diunggah {new Date(item.created_at).toLocaleDateString('id-ID')}
                </span>
                <Badge variant="outline" className="text-[9px] font-black uppercase h-5 px-1.5 border-slate-200 text-slate-400">
                  {item.file_type || 'PDF'}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="py-2 space-y-6">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Deskripsi / Instruksi</h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 text-sm font-medium whitespace-pre-wrap min-h-[100px]">
              {item.deskripsi || <span className="text-slate-400 italic">Tidak ada deskripsi.</span>}
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t border-slate-100">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose}
            className="font-bold text-xs uppercase tracking-widest h-12 rounded-xl"
          >
            Tutup
          </Button>
          {item.file_url && (
            <a 
              href={item.file_url} 
              target={config.isExternal ? "_blank" : undefined}
              rel={config.isExternal ? "noopener noreferrer" : undefined}
            >
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs h-12 px-6 rounded-xl shadow-lg shadow-emerald-100">
                <ButtonIconComponent className="h-4 w-4 mr-2" />
                {config.label}
              </Button>
            </a>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
