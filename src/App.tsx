import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronRight, 
  ChevronLeft, 
  ChevronUp,
  ChevronDown,
  Plus, 
  Calendar, 
  Clock, 
  BookOpen, 
  Coffee, 
  Home,
  ArrowRight,
  Check,
  History,
  Trash2,
  Layout,
  RotateCw,
  Maximize2,
  Zap,
  Pencil,
  Eraser,
  Undo2,
  ImagePlus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// --- Types ---

type Stage = "welcome" | "journey" | "journal" | "canvas";

interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  icon: string;
  label: string;
  category: "furniture" | "people" | "atmosphere" | "signals";
}

interface CanvasLayout {
  elements: CanvasElement[];
  reflection: string;
}

interface Entry {
  id: string;
  date: string;
  stages: {
    preparation: StageData;
    arrival: StageData;
    sitting: StageData;
    reflection: StageData;
  };
  overallFeeling: number;
  interacted: "Yes" | "No" | "Almost";
  summary: string;
  environment?: {
    noise: "Quiet" | "Moderate" | "Busy";
    company: "Alone" | "With others";
  };
  idealLayout?: CanvasLayout;
}

interface StageData {
  prompt: string;
  response: string;
  energy: number;
  notes?: string;
  sketch?: string;
  photo?: string;
}

const STAGES_CONFIG = [
  {
    id: "preparation",
    title: "Before leaving",
    subtitle: "Preparation",
    theme: "prep",
    accent: "prep-accent",
    badge: "Before you go",
    instruction: "Open before leaving",
    prompt: "Before you leave for the cafe, write or draw: What are you feeling right now about going to the cafe? What do you expect the experience to be like?",
    placeholder: "I'm feeling...",
    icon: <Clock size={20} />
  },
  {
    id: "arrival",
    title: "Arriving at the café",
    subtitle: "First Impressions",
    theme: "arrival",
    accent: "arrival-accent",
    badge: "You’ve arrived",
    instruction: "Open when arriving at cafe",
    prompt: "When you arrive, write or draw: What do you notice first about the space? How would you describe the atmosphere in 3 words?",
    placeholder: "The atmosphere is...",
    icon: <Maximize2 size={20} />
  },
  {
    id: "sitting",
    title: "Sitting down",
    subtitle: "Settling In",
    theme: "sitting",
    accent: "sitting-accent",
    badge: "Settled in",
    instruction: "Open when sitting down at cafe",
    prompt: "When you are sitting down, write or draw: What are you doing right now? Are you interacting with anyone? If yes, how? If no, why?",
    placeholder: "I'm currently...",
    icon: <Coffee size={20} />
  },
  {
    id: "reflection",
    title: "After returning",
    subtitle: "Reflection",
    theme: "reflection",
    accent: "reflection-accent",
    badge: "Looking back",
    instruction: "Open when you’ve returned home",
    prompt: "When you are back from the cafe, write or draw: What stood out most from your visit? Did your experience match your expectations? Why or why not?",
    placeholder: "Reflecting on the visit...",
    icon: <History size={20} />
  }
];

const EMOJIS = ["😫", "😕", "😐", "🙂", "✨"];

const ENERGY_LEVELS = [
  { color: "text-rose-600", bars: 0, type: "empty" },
  { color: "bg-rose-600", bars: 1, type: "bars" },
  { color: "bg-orange-500", bars: 2, type: "bars" },
  { color: "bg-amber-500", bars: 3, type: "bars" },
  { color: "bg-emerald-400", bars: 4, type: "bars" },
  { color: "bg-emerald-500", bars: 5, type: "bars" },
  { color: "bg-emerald-600", bars: 6, type: "full" },
];

const EnergyTracker = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => {
  return (
    <div className="space-y-8">
      <p className="text-center text-sm font-serif italic text-[#3D2B1F]/60">
        What's your social energy right now?
      </p>
      <div className="flex justify-center items-end gap-3 px-2">
        {ENERGY_LEVELS.map((level, i) => (
          <motion.button
            key={i}
            whileHover={{ y: -8, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(i)}
            className="relative group outline-none"
          >
            <div className={`relative w-11 h-18 border-[2.5px] rounded-[14px] flex flex-col-reverse items-center p-1 transition-all duration-300 ${
              value === i 
                ? "border-[#3D2B1F] bg-white shadow-lg -translate-y-2" 
                : "border-[#3D2B1F]/20 bg-transparent hover:border-[#3D2B1F]/40"
            }`}>
              {/* Battery Tip */}
              <div className={`absolute -top-[6px] left-1/2 -translate-x-1/2 w-4 h-[4px] rounded-t-full transition-colors ${
                value === i ? "bg-[#3D2B1F]" : "bg-[#3D2B1F]/20"
              }`} />
              
              {level.type === 'empty' && (
                <div className="flex-1 flex items-center justify-center">
                  <Zap size={20} className={`${level.color} fill-current`} />
                </div>
              )}
              
              {level.type === 'bars' && (
                <div className="w-full flex flex-col-reverse gap-[3px]">
                  {Array.from({ length: level.bars }).map((_, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      className={`h-[9px] w-full rounded-[4px] ${level.color}`} 
                    />
                  ))}
                </div>
              )}
              
              {level.type === 'full' && (
                <div className={`absolute inset-[3px] rounded-[10px] ${level.color} flex items-center justify-center`}>
                  <Zap size={20} className="text-white fill-white" />
                </div>
              )}
            </div>
            
            {/* Selection Indicator Dot */}
            <AnimatePresence>
              {value === i && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#3D2B1F]"
                />
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

const CafeFloorPlan = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
    {/* Floor Texture Variations */}
    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />
    
    {/* Zones with softer gradients */}
    <div className="absolute top-0 left-0 w-[35%] h-full bg-gradient-to-r from-blue-50/40 to-transparent border-r border-dashed border-blue-200/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-blue-400/30 rotate-90 whitespace-nowrap">Quiet Zone</span>
        <div className="w-px h-32 bg-blue-200/20" />
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-blue-400/30 rotate-90 whitespace-nowrap">Focused Work</span>
      </div>
    </div>
    
    <div className="absolute top-0 right-0 w-[35%] h-full bg-gradient-to-l from-orange-50/40 to-transparent border-l border-dashed border-orange-200/30 flex items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-orange-400/30 -rotate-90 whitespace-nowrap">Social Zone</span>
        <div className="w-px h-32 bg-orange-200/20" />
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-orange-400/30 -rotate-90 whitespace-nowrap">Conversation</span>
      </div>
    </div>
    
    <div className="absolute inset-x-[35%] h-full bg-slate-50/10 flex items-center justify-center">
      <div className="relative h-full w-full flex items-center justify-center">
        <div className="absolute inset-y-0 w-px bg-slate-200/10 left-1/4" />
        <div className="absolute inset-y-0 w-px bg-slate-200/10 right-1/4" />
        <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-slate-400/20">Transition Path</span>
      </div>
    </div>

    {/* Coffee Counter - More detailed */}
    <div className="absolute top-0 inset-x-[25%] h-24 bg-white border-b-4 border-x-4 border-secondary/20 rounded-b-[3rem] apple-shadow flex flex-col items-center justify-center z-10">
      <div className="w-32 h-1.5 bg-secondary/20 rounded-full mb-3" />
      <span className="text-[10px] font-bold text-muted-foreground/60 tracking-[0.3em] uppercase">Coffee Bar & Service</span>
      <div className="absolute bottom-2 flex gap-4">
        <div className="w-2 h-2 rounded-full bg-secondary/30" />
        <div className="w-2 h-2 rounded-full bg-secondary/30" />
        <div className="w-2 h-2 rounded-full bg-secondary/30" />
      </div>
    </div>

    {/* Windows with "light" effect */}
    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-sky-100/40 to-transparent" />
    <div className="absolute left-4 top-[15%] bottom-[15%] flex flex-col justify-around">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="w-1 h-32 bg-sky-200/20 rounded-full shadow-[0_0_15px_rgba(186,230,253,0.3)]" />
      ))}
    </div>
    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-[10px] font-bold text-sky-400/20 -rotate-90 tracking-[0.3em] uppercase">Natural Light Seating</div>

    {/* Entrance - More prominent */}
    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-primary/10 rounded-t-full" />
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
      <div className="w-12 h-0.5 bg-primary/20 rounded-full" />
      <span className="text-[10px] font-bold text-primary/30 uppercase tracking-[0.4em]">Main Entrance</span>
    </div>

    {/* Structural Pillars */}
    <div className="absolute top-1/3 left-[35%] -translate-x-1/2 w-6 h-6 bg-secondary/10 rounded-sm border border-secondary/20" />
    <div className="absolute bottom-1/3 left-[35%] -translate-x-1/2 w-6 h-6 bg-secondary/10 rounded-sm border border-secondary/20" />
    <div className="absolute top-1/3 right-[35%] translate-x-1/2 w-6 h-6 bg-secondary/10 rounded-sm border border-secondary/20" />
    <div className="absolute bottom-1/3 right-[35%] translate-x-1/2 w-6 h-6 bg-secondary/10 rounded-sm border border-secondary/20" />

    {/* Corner Details */}
    <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-secondary/10 rounded-tl-3xl" />
    <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-secondary/10 rounded-tr-3xl" />
    <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-secondary/10 rounded-bl-3xl" />
    <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-secondary/10 rounded-br-3xl" />
  </div>
);

const TOOLKIT_ITEMS: Omit<CanvasElement, "id" | "x" | "y" | "rotation" | "scale">[] = [
  { type: "table-small", icon: "🔲", label: "Small Table", category: "furniture" },
  { type: "table-shared", icon: "▭", label: "Shared Table", category: "furniture" },
  { type: "chair", icon: "🪑", label: "Chair", category: "furniture" },
  { type: "person-alone", icon: "👤", label: "Alone", category: "people" },
  { type: "person-group", icon: "👥", label: "Group", category: "people" },
  { type: "posture-open", icon: "👐", label: "Open Posture", category: "people" },
  { type: "posture-closed", icon: "🙅", label: "Closed Posture", category: "people" },
  { type: "lamp", icon: "💡", label: "Warm Lamp", category: "atmosphere" },
  { type: "plant", icon: "🌿", label: "Plant", category: "atmosphere" },
  { type: "noise-quiet", icon: "🤫", label: "Quiet Zone", category: "atmosphere" },
  { type: "noise-busy", icon: "🐝", label: "Busy Zone", category: "atmosphere" },
  { type: "signal-open", icon: "💬", label: "Open to Talk", category: "signals" },
  { type: "signal-private", icon: "📵", label: "Private", category: "signals" },
];

// --- Components ---

const Envelope = ({ children, isOpen, onOpen, stageIndex }: { children: React.ReactNode; isOpen: boolean; onOpen: () => void; stageIndex: number }) => {
  const config = STAGES_CONFIG[stageIndex];
  
  return (
    <div className="relative w-full max-w-md mx-auto perspective-1000">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="closed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 1.05, 
              rotateX: 15,
              y: -20,
              transition: { duration: 0.4, ease: "easeIn" }
            }}
            whileHover={{ 
              scale: 1.02,
              y: -5,
              transition: { duration: 0.3 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpen}
            className="cursor-pointer group relative"
          >
            {/* Paper Layer Effect */}
            <div className="absolute inset-0 bg-black/5 rounded-[2.5rem] translate-y-2 translate-x-1 blur-sm" />
            
            <Card className={`paper-texture apple-shadow border-none rounded-[2.5rem] overflow-hidden relative bg-[var(--color-${config.theme})]/90 backdrop-blur-sm shadow-[var(--shadow-inner)]`}>
              <div className="p-12 text-center space-y-8 relative">
                {/* Elevated Chip */}
                <motion.div 
                  initial={{ y: 0 }}
                  whileHover={{ y: -8 }}
                  className={`w-20 h-20 rounded-full flex flex-col items-center justify-center mx-auto text-white shadow-xl text-3xl font-serif bg-[var(--color-${config.accent})] relative z-10 border-4 border-white/20`}
                >
                  <span className="leading-none">{stageIndex + 1}</span>
                  <div className="absolute -bottom-1 opacity-40">{config.icon}</div>
                </motion.div>
                
                <div className="space-y-2">
                  <h3 className="text-3xl font-serif text-[#3D2B1F] tracking-tight">Envelope {stageIndex + 1}</h3>
                  <p className="text-sm text-[#3D2B1F]/50 font-medium italic">{config.instruction}</p>
                </div>

                <div className="space-y-4">
                  <Badge className={`rounded-full px-6 py-2 bg-[var(--color-${config.accent})] text-white border-none shadow-md text-xs font-semibold tracking-wide`}>
                    {config.badge}
                  </Badge>
                  
                  <motion.p 
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#3D2B1F]/30"
                  >
                    Tap to open
                  </motion.p>
                </div>

                {/* Subtle Context Hint */}
                <div className="absolute top-6 right-8 opacity-10 text-[#3D2B1F]">
                  {config.icon}
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="open"
            initial={{ opacity: 0, scale: 0.95, y: 30, rotateX: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SketchCanvas = ({ value, onChange, onPhotoUpload }: { value?: string; onChange: (v: string) => void; onPhotoUpload: (v: string) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [history, setHistory] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size based on container
    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = 200;
        
        // Restore content if exists
        if (value) {
          const img = new Image();
          img.onload = () => ctx.drawImage(img, 0, 0);
          img.src = value;
        }
      }
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Save history before drawing
    setHistory(prev => [...prev, canvas.toDataURL()]);

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = tool === "pen" ? 2 : 20;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = tool === "pen" ? "#3D2B1F" : "#F1F1F1";
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ("touches" in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ("touches" in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL());
    }
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lastState = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      onChange(canvas.toDataURL());
    };
    img.src = lastState;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        onPhotoUpload(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative bg-[#F1F1F1] rounded-2xl overflow-hidden touch-none border border-black/5">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full cursor-crosshair"
        />
        
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Button
            variant={tool === "pen" ? "default" : "secondary"}
            size="icon"
            onClick={() => setTool("pen")}
            className="w-10 h-10 rounded-full apple-shadow"
          >
            <Pencil size={18} />
          </Button>
          <Button
            variant={tool === "eraser" ? "default" : "secondary"}
            size="icon"
            onClick={() => setTool("eraser")}
            className="w-10 h-10 rounded-full apple-shadow"
          >
            <Eraser size={18} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            onClick={undo}
            disabled={history.length === 0}
            className="w-10 h-10 rounded-full apple-shadow"
          >
            <Undo2 size={18} />
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground hover:text-primary transition-colors"
        >
          <ImagePlus size={14} className="mr-2" />
          Upload photo or drawing
        </Button>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [stage, setStage] = useState<Stage>("welcome");
  const [currentStep, setCurrentStep] = useState(0);
  const [isEnvelopeOpen, setIsEnvelopeOpen] = useState(false);
  const [journal, setJournal] = useState<Entry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  
  // Canvas State
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>([]);
  const [canvasReflection, setCanvasReflection] = useState("");
  const [isToolkitCollapsed, setIsToolkitCollapsed] = useState(false);
  const [isReflectionCollapsed, setIsReflectionCollapsed] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Current Journey State
  const [responses, setResponses] = useState<Record<string, StageData>>({
    preparation: { prompt: "", response: "", energy: 2, sketch: "", photo: "" },
    arrival: { prompt: "", response: "", energy: 2, sketch: "", photo: "" },
    sitting: { prompt: "", response: "", energy: 2, sketch: "", photo: "" },
    reflection: { prompt: "", response: "", energy: 2, sketch: "", photo: "" },
  });
  const [interacted, setInteracted] = useState<"Yes" | "No" | "Almost">("No");
  const [environment, setEnvironment] = useState<{ noise: "Quiet" | "Moderate" | "Busy"; company: "Alone" | "With others" }>({
    noise: "Moderate",
    company: "Alone"
  });

  // Load Journal
  useEffect(() => {
    const saved = localStorage.getItem("cafe_probe_journal");
    if (saved) {
      try {
        setJournal(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse journal", e);
      }
    }
  }, []);

  const saveToJournal = (goToCanvas = false) => {
    const newEntry: Entry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      stages: responses as Entry["stages"],
      overallFeeling: responses.reflection.energy,
      interacted,
      summary: responses.reflection.response,
      environment,
    };
    const updatedJournal = [newEntry, ...journal];
    setJournal(updatedJournal);
    localStorage.setItem("cafe_probe_journal", JSON.stringify(updatedJournal));
    toast.success("Experience saved to your journal");
    
    if (goToCanvas) {
      openCanvasForEntry(newEntry);
    } else {
      setStage("journal");
    }
  };

  const saveCanvasToEntry = (entryId: string) => {
    const updatedJournal = journal.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          idealLayout: {
            elements: canvasElements,
            reflection: canvasReflection
          }
        };
      }
      return entry;
    });
    setJournal(updatedJournal);
    localStorage.setItem("cafe_probe_journal", JSON.stringify(updatedJournal));
    toast.success("Ideal café design saved");
    setStage("journal");
    setSelectedEntryId(entryId);
  };

  const deleteEntry = (id: string) => {
    const updated = journal.filter(e => e.id !== id);
    setJournal(updated);
    localStorage.setItem("cafe_probe_journal", JSON.stringify(updated));
    toast.info("Entry deleted");
  };

  const startNewJourney = () => {
    setResponses({
      preparation: { prompt: "", response: "", energy: 2, sketch: "", photo: "" },
      arrival: { prompt: "", response: "", energy: 2, sketch: "", photo: "" },
      sitting: { prompt: "", response: "", energy: 2, sketch: "", photo: "" },
      reflection: { prompt: "", response: "", energy: 2, sketch: "", photo: "" },
    });
    setCurrentStep(0);
    setIsEnvelopeOpen(false);
    setCanvasElements([]);
    setCanvasReflection("");
    setStage("journey");
  };

  const openCanvasForEntry = (entry: Entry) => {
    setCanvasElements(entry.idealLayout?.elements || []);
    setCanvasReflection(entry.idealLayout?.reflection || "");
    setSelectedEntryId(entry.id);
    setStage("canvas");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center selection:bg-primary/10 selection:text-primary">
      <Toaster position="top-center" />
      
      {/* Navigation Bar */}
      {stage !== "canvas" && (
        <nav className="fixed top-0 w-full max-w-2xl px-6 h-20 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white apple-shadow rounded-lg flex items-center justify-center text-primary">
              <Coffee size={18} />
            </div>
            <span className="font-semibold text-sm tracking-tight">Café Probe</span>
          </div>
          <div className="flex gap-1 bg-white/50 backdrop-blur-md p-1 rounded-full apple-shadow">
            <Button 
              variant={stage === "welcome" ? "secondary" : "ghost"} 
              size="sm" 
              className="rounded-full h-8 text-xs px-4"
              onClick={() => setStage("welcome")}
            >
              Home
            </Button>
            <Button 
              variant={stage === "journal" ? "secondary" : "ghost"} 
              size="sm" 
              className="rounded-full h-8 text-xs px-4"
              onClick={() => setStage("journal")}
            >
              Journal
            </Button>
          </div>
        </nav>
      )}

      <main className={`w-full flex-1 flex flex-col ${stage === "canvas" ? "" : "max-w-2xl px-6 pt-32 pb-20"}`}>
        <AnimatePresence mode="wait">
          
          {/* Welcome Screen */}
          {stage === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col items-center justify-center text-center py-12 bg-[#F5F0E8] -mx-6 px-6 rounded-[3rem]"
            >
              <h1 className="text-6xl font-serif mb-2 text-[#3D2B1F]">The Cafe Experience</h1>
              <p className="text-xl font-serif italic text-[#3D2B1F]/60 mb-8">A Cultural Probe on Social Interaction</p>
              
              <div className="w-48 h-0.5 bg-[#D48C6A] mb-12" />
              
              <div className="max-w-xl space-y-6 text-left text-[#3D2B1F]/80 leading-relaxed">
                <p className="font-bold">Thanks for being part of this project, we really appreciate it.</p>
                <p>This kit is meant to guide you through your next café visit and help you think about your experience, especially how you interact with the space and people around you.</p>
                <p>There are no right or wrong answers. Just be honest and go with whatever feels natural.</p>
                <p>Please complete each activity in order and only open each envelope when instructed.</p>
                <p className="italic text-[#3D2B1F]/60">We're excited to see your responses and learn from your experience.</p>
                <p className="font-medium">— Café Social Experience Research Team</p>
              </div>

              <Button onClick={startNewJourney} className="mt-12 h-14 px-10 rounded-full text-base font-medium bg-[#3D2B1F] hover:bg-[#3D2B1F]/90 text-white apple-shadow group">
                Start your experience
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          )}

          {/* Journey Steps */}
          {stage === "journey" && (
            <motion.div
              key="journey"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-12 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary mb-1">
                    Stage {currentStep + 1} of 4
                  </p>
                  <h2 className="text-2xl font-bold">{STAGES_CONFIG[currentStep].title}</h2>
                </div>
                <div className="flex gap-2">
                  {STAGES_CONFIG.map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 w-8 rounded-full transition-all duration-500 ${
                        i <= currentStep ? "bg-primary" : "bg-secondary"
                      }`} 
                    />
                  ))}
                </div>
              </div>

              <Envelope 
                isOpen={isEnvelopeOpen} 
                onOpen={() => setIsEnvelopeOpen(true)}
                stageIndex={currentStep}
              >
                <Card className="apple-shadow border-none bg-white rounded-[2.5rem] overflow-hidden">
                  <CardContent className="p-8 md:p-12 space-y-10">
                    <div className="space-y-6">
                      <h3 className="text-2xl font-serif leading-tight text-[#3D2B1F]">
                        {STAGES_CONFIG[currentStep].prompt}
                      </h3>
                      <Textarea 
                        value={responses[STAGES_CONFIG[currentStep].id].response}
                        onChange={(e) => setResponses({
                          ...responses,
                          [STAGES_CONFIG[currentStep].id]: {
                            ...responses[STAGES_CONFIG[currentStep].id],
                            response: e.target.value
                          }
                        })}
                        placeholder={STAGES_CONFIG[currentStep].placeholder}
                        className="min-h-[160px] rounded-2xl border-none bg-secondary/30 focus-visible:ring-primary/20 p-6 text-lg font-normal resize-none placeholder:text-muted-foreground/30"
                      />
                    </div>

                    <EnergyTracker 
                      value={responses[STAGES_CONFIG[currentStep].id].energy}
                      onChange={(v) => setResponses({
                        ...responses,
                        [STAGES_CONFIG[currentStep].id]: {
                          ...responses[STAGES_CONFIG[currentStep].id],
                          energy: v
                        }
                      })}
                    />

                    {/* Additional Instructions - Available in all envelopes */}
                    <div className="p-8 bg-secondary/10 rounded-[2rem] space-y-6 border border-black/5">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Quick Sketch or Photo</p>
                        <p className="text-xs text-muted-foreground/70">Capture a quick thought or snap a photo of your environment.</p>
                      </div>
                      
                      <SketchCanvas 
                        value={responses[STAGES_CONFIG[currentStep].id].sketch}
                        onChange={(v) => setResponses({
                          ...responses,
                          [STAGES_CONFIG[currentStep].id]: {
                            ...responses[STAGES_CONFIG[currentStep].id],
                            sketch: v
                          }
                        })}
                        onPhotoUpload={(v) => {
                          setResponses({
                            ...responses,
                            [STAGES_CONFIG[currentStep].id]: {
                              ...responses[STAGES_CONFIG[currentStep].id],
                              photo: v
                            }
                          });
                          toast.success("Photo added to reflection");
                        }}
                      />

                      {responses[STAGES_CONFIG[currentStep].id].photo && (
                        <div className="relative rounded-xl overflow-hidden apple-shadow aspect-video bg-black/5">
                          <img 
                            src={responses[STAGES_CONFIG[currentStep].id].photo} 
                            alt="Uploaded" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setResponses({
                              ...responses,
                              [STAGES_CONFIG[currentStep].id]: {
                                ...responses[STAGES_CONFIG[currentStep].id],
                                photo: ""
                              }
                            })}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full"
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      )}

                      <div className="text-[10px] text-muted-foreground/50 italic leading-relaxed">
                        <p>Take 1-2 photos during your café visit. Choose something that stands out to you. Please do not take photos of people without consent.</p>
                      </div>
                    </div>

                    {currentStep === 1 && (
                      <div className="p-6 bg-secondary/20 rounded-2xl space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cafe Map</p>
                        <div className="text-xs text-muted-foreground space-y-2">
                          <p>Sketch the café around you. Don't worry about being accurate, just draw what you notice.</p>
                          <ul className="list-disc list-inside space-y-1 opacity-70">
                            <li>Sketch the overall floor plan</li>
                            <li>Mark where you are sitting</li>
                            <li>Mark where you feel most/least comfortable</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="p-6 bg-secondary/20 rounded-2xl space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Observations</p>
                        <div className="text-xs text-muted-foreground space-y-2">
                          <p>Notice someone nearby: what are they doing? Are they alone or with others?</p>
                        </div>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="space-y-8 pt-4 border-t border-secondary">
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                            Did you interact with someone?
                          </h3>
                          <div className="flex gap-2">
                            {(["Yes", "No", "Almost"] as const).map(opt => (
                              <Button
                                key={opt}
                                variant={interacted === opt ? "default" : "outline"}
                                onClick={() => setInteracted(opt)}
                                className="flex-1 rounded-xl h-12 text-xs font-medium transition-all"
                              >
                                {opt}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                            Environment Context
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-muted-foreground">NOISE</p>
                              <div className="flex flex-col gap-1">
                                {(["Quiet", "Moderate", "Busy"] as const).map(n => (
                                  <Button
                                    key={n}
                                    variant={environment.noise === n ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setEnvironment({ ...environment, noise: n })}
                                    className="justify-start h-8 text-[11px] rounded-lg"
                                  >
                                    {n}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <p className="text-[10px] font-bold text-muted-foreground">COMPANY</p>
                              <div className="flex flex-col gap-1">
                                {(["Alone", "With others"] as const).map(c => (
                                  <Button
                                    key={c}
                                    variant={environment.company === c ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setEnvironment({ ...environment, company: c })}
                                    className="justify-start h-8 text-[11px] rounded-lg"
                                  >
                                    {c}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 pt-4">
                      <div className="flex gap-3">
                        {currentStep > 0 && (
                          <Button 
                            variant="secondary" 
                            size="lg"
                            onClick={() => {
                              setCurrentStep(currentStep - 1);
                              setIsEnvelopeOpen(true);
                            }}
                            className="rounded-full w-14 h-14 p-0"
                          >
                            <ChevronLeft />
                          </Button>
                        )}
                        <Button 
                          size="lg"
                          disabled={!responses[STAGES_CONFIG[currentStep].id].response}
                          onClick={() => {
                            if (currentStep < 3) {
                              setCurrentStep(currentStep + 1);
                              setIsEnvelopeOpen(false);
                            } else {
                              saveToJournal(false);
                            }
                          }}
                          className="flex-1 h-14 rounded-full text-base font-medium apple-shadow"
                        >
                          {currentStep < 3 ? "Next Stage" : "Save to Journal"}
                          {currentStep < 3 ? <ChevronRight className="ml-2 w-4 h-4" /> : <Check className="ml-2 w-4 h-4" />}
                        </Button>
                      </div>
                      
                      {currentStep === 3 && responses[STAGES_CONFIG[currentStep].id].response && (
                        <Button 
                          variant="outline"
                          size="lg"
                          onClick={() => saveToJournal(true)}
                          className="w-full h-14 rounded-full text-base font-medium border-primary/20 text-primary hover:bg-primary/5"
                        >
                          <Layout className="mr-2 w-4 h-4" />
                          Save & Design Ideal Café
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Envelope>
            </motion.div>
          )}

          {/* Canvas Mode Screen */}
          {stage === "canvas" && (
            <motion.div
              key="canvas"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#F8F9FA] flex flex-col z-[100]"
            >
              {/* Top Navigation Bar */}
              <div className="h-16 px-6 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-secondary/30 z-50">
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setStage("journal");
                      setSelectedEntryId(selectedEntryId);
                    }}
                    className="rounded-full"
                  >
                    <ChevronLeft size={20} />
                  </Button>
                  <div>
                    <h2 className="text-sm font-bold tracking-tight">Design Your Ideal Café</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Workspace</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="rounded-full text-xs font-semibold px-4"
                    onClick={() => {
                      setCanvasElements([]);
                      setCanvasReflection("");
                    }}
                  >
                    Clear
                  </Button>
                  <Button 
                    size="sm"
                    className="rounded-full text-xs font-semibold px-6 apple-shadow"
                    disabled={!canvasReflection || canvasElements.length === 0}
                    onClick={() => selectedEntryId && saveCanvasToEntry(selectedEntryId)}
                  >
                    Save Design
                  </Button>
                </div>
              </div>

              <div className="flex-1 relative overflow-hidden flex">
                {/* Floating Toolkit Panel */}
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ 
                    x: 0, 
                    opacity: 1,
                    width: isToolkitCollapsed ? 80 : 288
                  }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="absolute left-6 top-6 bottom-6 z-40"
                >
                  <Card className="h-full apple-shadow border-none bg-white/90 backdrop-blur-xl rounded-[2rem] flex flex-col overflow-hidden border border-white/20">
                    <div className={`p-6 border-b border-secondary/30 flex items-center justify-between ${isToolkitCollapsed ? 'flex-col gap-4' : ''}`}>
                      {!isToolkitCollapsed && (
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Toolkit</p>
                          <p className="text-xs text-muted-foreground/60 mt-1">Drag items to canvas</p>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsToolkitCollapsed(!isToolkitCollapsed)}
                        className="rounded-full hover:bg-secondary/40"
                      >
                        {isToolkitCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                      </Button>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
                      <div className={`p-6 ${isToolkitCollapsed ? 'space-y-6 px-4' : 'space-y-8'}`}>
                        {["furniture", "people", "atmosphere", "signals"].map(cat => (
                          <div key={cat} className="space-y-4">
                            {!isToolkitCollapsed && (
                              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/60">{cat}</p>
                            )}
                            <div className={`grid ${isToolkitCollapsed ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
                              {TOOLKIT_ITEMS.filter(item => item.category === cat).map(item => (
                                <motion.button
                                  key={item.type}
                                  whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.02)" }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    const newEl: CanvasElement = {
                                      ...item,
                                      id: Date.now().toString(),
                                      x: 50,
                                      y: 50,
                                      rotation: 0,
                                      scale: 1.5
                                    };
                                    setCanvasElements([...canvasElements, newEl]);
                                  }}
                                  className={`flex flex-col items-center justify-center bg-secondary/20 rounded-2xl transition-all gap-2 border border-transparent hover:border-black/5 ${isToolkitCollapsed ? 'p-3' : 'p-4'}`}
                                >
                                  <span className={isToolkitCollapsed ? 'text-xl' : 'text-2xl'}>{item.icon}</span>
                                  {!isToolkitCollapsed && (
                                    <span className="text-[9px] font-bold text-center leading-tight uppercase tracking-tighter opacity-60">{item.label}</span>
                                  )}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Main Canvas Area */}
                <div className="flex-1 relative bg-[#F8F9FA] overflow-hidden">
                  <div 
                    ref={canvasRef}
                    className="absolute inset-0 transition-all duration-500"
                    style={{ 
                      backgroundImage: 'radial-gradient(circle, #D1D5DB 1px, transparent 1px)', 
                      backgroundSize: '40px 40px' 
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                      <Coffee size={400} />
                    </div>
                    
                    <div className="w-full h-full relative">
                      <CafeFloorPlan />
                      
                      {canvasElements.length === 0 && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-20 pointer-events-none">
                          <Layout size={64} className="mb-4" />
                          <p className="text-lg font-serif italic">Your Canvas is Empty</p>
                          <p className="text-sm">Select items from the toolkit to begin designing</p>
                        </div>
                      )}
                      
                      {canvasElements.map(el => (
                        <motion.div
                          key={el.id}
                          drag
                          dragMomentum={false}
                          dragConstraints={canvasRef}
                          onDragEnd={(_, info) => {
                            if (!canvasRef.current) return;
                            const rect = canvasRef.current.getBoundingClientRect();
                            const SNAP_SIZE = 2;
                            const rawX = ((info.point.x - rect.left) / rect.width) * 100;
                            const rawY = ((info.point.y - rect.top) / rect.height) * 100;
                            
                            const x = Math.round(rawX / SNAP_SIZE) * SNAP_SIZE;
                            const y = Math.round(rawY / SNAP_SIZE) * SNAP_SIZE;
                            
                            setCanvasElements(canvasElements.map(item => 
                              item.id === el.id ? { ...item, x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) } : item
                            ));
                          }}
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ 
                            scale: el.scale, 
                            opacity: 1,
                            rotate: el.rotation,
                            left: `${el.x}%`,
                            top: `${el.y}%`
                          }}
                          className="absolute cursor-grab active:cursor-grabbing group z-10"
                          style={{ transform: 'translate(-50%, -50%)' }}
                        >
                          <div className="relative p-6">
                            <span className="text-5xl select-none drop-shadow-sm">{el.icon}</span>
                            
                            {/* Controls Overlay */}
                            <div className="absolute -top-1 -right-1 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                              <Button 
                                size="icon" 
                                variant="secondary" 
                                className="w-8 h-8 rounded-full bg-white apple-shadow border border-black/5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCanvasElements(canvasElements.map(item => 
                                    item.id === el.id ? { ...item, rotation: (item.rotation + 45) % 360 } : item
                                  ));
                                }}
                              >
                                <RotateCw size={12} />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="secondary" 
                                className="w-8 h-8 rounded-full bg-white apple-shadow border border-black/5 text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCanvasElements(canvasElements.filter(item => item.id !== el.id));
                                }}
                              >
                                <X size={12} />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Reflection Panel (Floating) */}
                <motion.div 
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ 
                    x: 0, 
                    opacity: 1,
                    y: isReflectionCollapsed ? 120 : 0,
                    scale: isReflectionCollapsed ? 0.95 : 1
                  }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="absolute right-6 bottom-6 w-80 z-40"
                >
                  <Card 
                    className={`apple-shadow border-none bg-white/90 backdrop-blur-xl rounded-[2rem] p-6 space-y-4 border border-white/20 transition-all duration-500 ${isReflectionCollapsed ? 'cursor-pointer hover:bg-white/95' : ''}`}
                    onClick={() => isReflectionCollapsed && setIsReflectionCollapsed(false)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-primary" />
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Design Reflection</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsReflectionCollapsed(!isReflectionCollapsed);
                        }}
                        className="w-6 h-6 rounded-full hover:bg-secondary/40"
                      >
                        {isReflectionCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </Button>
                    </div>
                    
                    {!isReflectionCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <Textarea 
                          placeholder="Why did you design this space this way? What makes it comfortable for you?"
                          value={canvasReflection}
                          onChange={(e) => setCanvasReflection(e.target.value)}
                          className="min-h-[120px] rounded-2xl border-none bg-secondary/40 focus-visible:ring-primary/20 p-4 text-sm leading-relaxed resize-none"
                        />
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 italic px-1">
                          <Check size={10} />
                          <span>Auto-saving to journal</span>
                        </div>
                      </motion.div>
                    )}
                    
                    {isReflectionCollapsed && (
                      <p className="text-[10px] text-muted-foreground/40 italic text-center py-2">Tap to expand reflection</p>
                    )}
                  </Card>
                </motion.div>

                {/* Bottom Mode Indicator */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
                  <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full apple-shadow border border-secondary/30 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Immersive Design Mode</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {/* Journal Screen */}
          {stage === "journal" && (
            <motion.div
              key="journal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col"
            >
              <AnimatePresence mode="wait">
                {selectedEntryId ? (
                  <motion.div
                    key="detail"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    <div className="flex items-center justify-between">
                      <Button 
                        variant="ghost" 
                        onClick={() => setSelectedEntryId(null)}
                        className="rounded-full h-10 px-4 text-primary font-semibold flex items-center gap-2"
                      >
                        <ChevronLeft size={18} />
                        Journal
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full h-10 w-10 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            deleteEntry(selectedEntryId);
                            setSelectedEntryId(null);
                          }}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </div>

                    {journal.find(e => e.id === selectedEntryId) && (
                      <div className="space-y-10 pb-10">
                        <header className="space-y-2">
                          <h2 className="text-3xl font-bold tracking-tight">
                            {new Date(journal.find(e => e.id === selectedEntryId)!.date).toLocaleDateString(undefined, { 
                              weekday: 'long',
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </h2>
                          <p className="text-muted-foreground flex items-center gap-2">
                            <Clock size={14} />
                            {new Date(journal.find(e => e.id === selectedEntryId)!.date).toLocaleTimeString(undefined, { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </header>

                        <div className="grid grid-cols-2 gap-4">
                          <Card className="apple-shadow border-none bg-white rounded-3xl p-6">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4">EMOTION</p>
                            <div className="flex items-center gap-3">
                              <span className="text-4xl">{EMOJIS[journal.find(e => e.id === selectedEntryId)!.overallFeeling]}</span>
                              <span className="text-sm font-medium">
                                {["Stressed", "Unsure", "Neutral", "Good", "Excellent"][journal.find(e => e.id === selectedEntryId)!.overallFeeling]}
                              </span>
                            </div>
                          </Card>
                          <Card className="apple-shadow border-none bg-white rounded-3xl p-6">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4">INTERACTION</p>
                            <div className="flex items-center gap-2">
                              <Badge className="rounded-full bg-primary/10 text-primary border-none px-4 py-1">
                                {journal.find(e => e.id === selectedEntryId)!.interacted}
                              </Badge>
                            </div>
                          </Card>
                        </div>

                        {journal.find(e => e.id === selectedEntryId)!.environment && (
                          <Card className="apple-shadow border-none bg-white rounded-3xl p-6">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-4">ENVIRONMENT</p>
                            <div className="flex gap-6">
                              <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-bold">NOISE</p>
                                <p className="text-sm font-medium">{journal.find(e => e.id === selectedEntryId)!.environment?.noise}</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground font-bold">COMPANY</p>
                                <p className="text-sm font-medium">{journal.find(e => e.id === selectedEntryId)!.environment?.company}</p>
                              </div>
                            </div>
                          </Card>
                        )}

                        <div className="space-y-6">
                          <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Journey Details</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {STAGES_CONFIG.map(stage => {
                              const data = journal.find(e => e.id === selectedEntryId)!.stages[stage.id as keyof Entry["stages"]];
                              return (
                                <Card key={stage.id} className={`apple-shadow border-none rounded-3xl overflow-hidden bg-[var(--color-${stage.theme})]`}>
                                  <div className={`px-6 py-3 bg-[var(--color-${stage.accent})] text-white flex justify-between items-center`}>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{stage.subtitle}</span>
                                    <div className="flex gap-0.5">
                                      {ENERGY_LEVELS.map((level, i) => (
                                        <div 
                                          key={i} 
                                          className={`w-1.5 h-3 rounded-full ${
                                            i <= data.energy 
                                              ? "bg-white" 
                                              : "bg-white/30"
                                          }`} 
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <CardContent className="p-6 space-y-4">
                                    <p className="text-sm font-serif italic text-[#3D2B1F]/60 leading-relaxed">
                                      "{stage.prompt}"
                                    </p>
                                    <p className="text-base text-[#3D2B1F] leading-relaxed">
                                      {data.response}
                                    </p>
                                    {data.sketch && (
                                      <div className="rounded-xl overflow-hidden border border-black/5 bg-white/50 p-2">
                                        <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Quick Sketch</p>
                                        <img src={data.sketch} alt="Sketch" className="w-full h-auto rounded-lg" referrerPolicy="no-referrer" />
                                      </div>
                                    )}
                                    {data.photo && (
                                      <div className="rounded-xl overflow-hidden border border-black/5 bg-white/50 p-2">
                                        <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Captured Photo</p>
                                        <img src={data.photo} alt="Photo" className="w-full h-auto rounded-lg" referrerPolicy="no-referrer" />
                                      </div>
                                    )}
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>

                        {/* Ideal Layout Preview */}
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground">Ideal Café Design</h3>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openCanvasForEntry(journal.find(e => e.id === selectedEntryId)!)}
                              className="text-xs h-8 rounded-full text-primary"
                            >
                              {journal.find(e => e.id === selectedEntryId)!.idealLayout ? "Edit Design" : "Create Design"}
                            </Button>
                          </div>
                          
                          {journal.find(e => e.id === selectedEntryId)!.idealLayout ? (
                            <Card className="apple-shadow border-none bg-white rounded-3xl overflow-hidden">
                              <div className="aspect-video bg-secondary/30 relative overflow-hidden">
                                <CafeFloorPlan />
                                {journal.find(e => e.id === selectedEntryId)!.idealLayout?.elements.map(el => (
                                  <div 
                                    key={el.id}
                                    className="absolute text-2xl select-none pointer-events-none"
                                    style={{ 
                                      left: `${el.x}%`, 
                                      top: `${el.y}%`,
                                      transform: `translate(-50%, -50%) rotate(${el.rotation}deg) scale(${el.scale})`
                                    }}
                                  >
                                    {el.icon}
                                  </div>
                                ))}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent flex items-end p-6">
                                  <Button 
                                    variant="secondary" 
                                    className="rounded-full bg-white/90 backdrop-blur-sm h-10 px-6 apple-shadow"
                                    onClick={() => openCanvasForEntry(journal.find(e => e.id === selectedEntryId)!)}
                                  >
                                    <Maximize2 size={16} className="mr-2" />
                                    Expand View
                                  </Button>
                                </div>
                              </div>
                              <div className="p-6">
                                <p className="text-sm italic text-muted-foreground leading-relaxed">
                                  "{journal.find(e => e.id === selectedEntryId)!.idealLayout?.reflection}"
                                </p>
                              </div>
                            </Card>
                          ) : (
                            <div className="bg-secondary/20 rounded-3xl p-12 text-center border-2 border-dashed border-secondary">
                              <Layout size={32} className="mx-auto mb-4 text-muted-foreground/50" />
                              <p className="text-sm text-muted-foreground mb-6">No ideal layout designed for this visit yet.</p>
                              <Button 
                                onClick={() => openCanvasForEntry(journal.find(e => e.id === selectedEntryId)!)}
                                className="rounded-full px-8"
                              >
                                Design Ideal Café
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="mb-10 flex items-end justify-between">
                      <div>
                        <h2 className="text-3xl font-bold tracking-tight mb-1">Your Journal</h2>
                        <p className="text-muted-foreground font-normal">Past café experiences and reflections</p>
                      </div>
                      <Button 
                        onClick={startNewJourney} 
                        size="icon" 
                        className="rounded-full w-12 h-12 apple-shadow"
                      >
                        <Plus />
                      </Button>
                    </div>

                    {journal.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-50">
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-6">
                          <History size={24} />
                        </div>
                        <p className="text-sm font-medium">No entries yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Your journey starts with your first visit</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {journal.map((entry) => (
                          <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <Card className="apple-shadow border-none bg-white rounded-3xl overflow-hidden group">
                              <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                                      <Calendar size={18} />
                                    </div>
                                    <div>
                                      <p className="text-lg font-serif text-[#3D2B1F]">
                                        {new Date(entry.date).toLocaleDateString(undefined, { 
                                          month: 'short', 
                                          day: 'numeric', 
                                          year: 'numeric' 
                                        })}
                                      </p>
                                      <p className="text-[10px] text-[#3D2B1F]/40 uppercase tracking-widest font-bold flex items-center gap-1">
                                        <Clock size={10} />
                                        {new Date(entry.date).toLocaleTimeString(undefined, { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="rounded-full px-3 py-1 font-normal text-[10px] bg-secondary/50">
                                      {EMOJIS[entry.overallFeeling]} Feeling
                                    </Badge>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={() => deleteEntry(entry.id)}
                                      className="rounded-full h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Trash2 size={14} />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <p className="text-sm font-normal leading-relaxed text-foreground/80 line-clamp-2">
                                    {entry.summary}
                                  </p>
                                  
                                  <div className="flex items-center justify-between pt-4 border-t border-secondary/50">
                                    <div className="flex gap-1">
                                      <Badge variant="outline" className="rounded-full text-[9px] uppercase tracking-widest font-bold border-primary/20 text-primary">
                                        Interacted: {entry.interacted}
                                      </Badge>
                                    </div>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={() => setSelectedEntryId(entry.id)}
                                      className="text-xs font-semibold text-primary rounded-full h-8 px-4 hover:bg-primary/5 transition-colors"
                                    >
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      <footer className="w-full max-w-2xl px-6 py-12 flex flex-col items-center gap-6 opacity-30">
        <div className="h-px w-12 bg-foreground" />
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold">
          Slow Technology • Introspection
        </p>
      </footer>
    </div>
  );
}
