/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useRef, useEffect, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Image as ImageIcon, 
  Layout, 
  Settings2, 
  Download, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  RefreshCw,
  Maximize2,
  Check
} from 'lucide-react';

// No direct SDK initialization in frontend for Security

type Step = 1 | 2 | 3;
type AspectRatio = '1:1' | '3:4' | '4:3' | '16:9';
type Quality = '1K' | '2K' | '4K';
type ModelType = 'Gemini 2.5' | 'Gemini 3.1';

interface PosterStyle {
  id: string;
  name: string;
  description: string;
  promptAddon: string;
}

const POSTER_STYLES: PosterStyle[] = [
  { id: 'minimalist', name: '极简主义', description: '干净、现代且聚焦', promptAddon: 'minimalist design, clean lines, high-end photography, studio lighting, negative space' },
  { id: 'retro', name: '复古 80年代', description: '霓虹色彩与怀旧感', promptAddon: '80s retro wave style, neon lights, grid background, synthwave aesthetic, vibrant colors' },
  { id: 'cinematic', name: '电影质感', description: '戏剧性的商业大片感', promptAddon: 'cinematic lighting, dramatic shadows, shallow depth of field, blockbuster movie poster style, hyper-realistic' },
  { id: 'popart', name: '波普艺术', description: '大胆色彩与图形风格', promptAddon: 'Andy Warhol pop art style, bold outlines, vibrant flat colors, halftone pattern, comic book aesthetic' },
  { id: 'summer', name: '夏日清爽', description: '阳光充足且解渴', promptAddon: 'bright sunny day, beach background, tropical atmosphere, splash of water, refreshing summer colors' },
  { id: 'nature-story', name: '自然物语', description: '草地、雪山与葡萄泡泡的清新自然感', promptAddon: 'Nature store aesthetic. High-end product photography. Background: a vast, lush green meadow with tiny white wildflowers (daisies), transition to a soft-focus distant range of sun-drenched mountains under a bright, high-key blue sky with wispy clouds. Foreground/Midground: The product is centered on the grass. Scattered bunches of fresh, glossy green grapes lie at the base. Magical floating soap bubbles surround the bottle, with individual green grapes perfectly suspended inside some of the bubbles. Lighting: Strong, crisp daylight from the top-left, casting soft shadows on the grass and creating bright high-key reflections on the bottle. High saturation, crisp details, airy and fresh atmosphere.' },
  { id: 'refreshing-moment', name: '劲爽时刻', description: '动感水景与飞溅冰块，捕捉清爽诱人的瞬间', promptAddon: 'advertising poster, commercial photography, product close-up with dynamic water splashing, refreshing and inducing mood, vertical composition, medium shot, slight high-angle view, foreground splashing water droplets and crystal clear ice cubes, hand naturally holding the product, transparent glass or visible liquid texture, bubbles in liquid, blurred bright summer colors background, high saturation, light source from top-left, high resolution' },
  { id: 'industrial', name: '工业风', description: '原始、硬朗且都市化', promptAddon: 'concrete textures, moody lighting, urban industrial aesthetic, dark tones, dramatic highlights' }
];

export default function App() {
  const [step, setStep] = useState<Step>(1);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<PosterStyle>(POSTER_STYLES[0]);
  const [analysis, setAnalysis] = useState<string>('');
  const [ratio, setRatio] = useState<AspectRatio>('1:1');
  const [modelType, setModelType] = useState<ModelType>('Gemini 3.1');
  const [quality, setQuality] = useState<Quality>('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Analyze image on step 1 -> 2 transition
  const analyzeImage = async (base64: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 })
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis || '一杯清爽的饮品');
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysis('一杯清凉的玻璃杯饮品');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setOriginalImage(base64);
        analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePoster = async () => {
    setIsGenerating(true);
    setGeneratedImage(null);
    try {
      const finalPrompt = `专业饮品广告海报。主题：${analysis}. 风格：${selectedStyle.promptAddon}. 专业商业摄影，细节惊人，高对比度。保持产品核心形态、飞溅水珠、冰块、果片等元素，整体风格、背景和光影效果一致。`;
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: finalPrompt,
          image: originalImage,
          ratio,
          modelType,
          quality
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      if (data.image) {
        setGeneratedImage(data.image);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `饮品海报_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getAspectClasses = (r: AspectRatio) => {
    switch (r) {
      case '1:1': return 'aspect-square';
      case '3:4': return 'aspect-[3/4]';
      case '4:3': return 'aspect-[4/3]';
      case '16:9': return 'aspect-video';
      default: return 'aspect-square';
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
      {/* Dynamic Background Blobs - Light Version */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 100, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-indigo-50/50 blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -45, 0],
            x: [0, -80, 0],
            y: [0, 120, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-[40%] -right-[15%] w-[70%] h-[70%] rounded-full bg-rose-50/30 blur-[150px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, -40, 0],
            y: [0, -60, 0]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-teal-50/20 blur-[130px]" 
        />
      </div>

      <nav className="relative z-10 p-6 flex justify-between items-center border-b border-zinc-100 backdrop-blur-xl bg-white/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-500">SIPSTYLE AI</h1>
            <p className="text-[10px] font-mono text-indigo-600 tracking-[0.3em] font-bold uppercase leading-none">Beverage Vision Lab</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3 active-nav-indicator">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                step === s 
                  ? 'bg-zinc-900 text-white shadow-xl scale-110' 
                  : step > s 
                    ? 'bg-indigo-500 text-white' 
                    : 'bg-zinc-100 text-zinc-300 border border-zinc-200'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              <span className={`text-xs font-bold tracking-widest transition-colors duration-500 ${
                step === s ? 'text-zinc-900' : 'text-zinc-300'
              }`}>
                {s === 1 ? '上传图片' : s === 2 ? '海报风格' : '渲染输出'}
              </span>
            </div>
          ))}
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <section className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/10 to-rose-500/10 rounded-[2.5rem] blur-2xl opacity-50" />
            <div className={`relative bg-white rounded-[2rem] overflow-hidden border border-zinc-100 transition-all duration-700 shadow-2xl shadow-zinc-200/50 backdrop-blur-3xl ${getAspectClasses(ratio)}`}>
              <AnimatePresence mode="wait">
                {!originalImage ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
                  >
                    <div className="w-24 h-24 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-8 rotate-3 shadow-inner">
                      <ImageIcon className="w-10 h-10 text-zinc-200" />
                    </div>
                    <h2 className="text-3xl font-display font-bold mb-4 text-zinc-900">等待你的作品</h2>
                    <p className="text-zinc-400 max-w-xs text-sm leading-relaxed">上传一张清凉的饮品照片，我们将为你重塑它的商业美感。</p>
                  </motion.div>
                ) : step === 3 && generatedImage ? (
                  <motion.div 
                    key="generated"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 group"
                  >
                    <img 
                      src={generatedImage} 
                      className="w-full h-full object-cover" 
                      alt="Generated Poster"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-white/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-md">
                      <button 
                        onClick={handleDownload}
                        className="bg-zinc-900 text-white px-10 py-4 rounded-xl font-black flex items-center gap-3 hover:bg-zinc-800 transition-all shadow-xl hover:scale-105 active:scale-95"
                      >
                        <Download className="w-6 h-6" />
                        立即下载 {quality} 规格
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="original"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0"
                  >
                    <img 
                      src={originalImage} 
                      className="w-full h-full object-contain bg-zinc-50" 
                      alt="Original" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-6 left-6 px-4 py-2 bg-white/80 backdrop-blur-md border border-zinc-100 rounded-full text-[10px] font-bold tracking-widest uppercase text-indigo-600">
                      Original Input
                    </div>
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-2xl flex flex-col items-center justify-center gap-6">
                        <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin" />
                        <div className="text-center space-y-2">
                          <p className="text-indigo-600 font-mono text-xs tracking-[0.4em] uppercase font-black">AI Analysis</p>
                          <p className="text-zinc-400 text-sm">正在解构饮品结构与环境色调...</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {originalImage && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex items-center gap-6 p-6 rounded-2xl bg-zinc-50/50 border border-zinc-100 backdrop-blur-md"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-inner">
                  <Maximize2 className="w-7 h-7 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-sm font-black tracking-widest text-zinc-900">动态构图比例</h3>
                  <p className="text-xs text-zinc-400 mt-1">{ratio} {ratio === '1:1' ? '| 正方形构图' : ratio === '16:9' ? '| 宽幅景观模式' : '| 纵向/横向视角'}</p>
                </div>
              </motion.div>
            )}
          </section>

          <section className="bg-white rounded-[2.5rem] p-10 lg:p-12 border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] backdrop-blur-3xl">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="space-y-3">
                    <span className="inline-block px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 font-mono text-[10px] font-black tracking-widest uppercase">Phase 01</span>
                    <h2 className="text-5xl font-display font-bold tracking-tight text-zinc-900 text-[10px] font-black tracking-widest uppercase">灵感导入</h2>
                    <p className="text-zinc-400 text-sm leading-relaxed">开始之前，我们需要捕捉一张关于味觉与色彩的视觉切片。</p>
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative cursor-pointer border-2 border-dashed border-zinc-100 rounded-3xl p-16 text-center transition-all hover:bg-zinc-50 hover:border-indigo-200"
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                    />
                    <div className="w-24 h-24 mx-auto rounded-2xl bg-zinc-50 flex items-center justify-center mb-8 border border-zinc-100 group-hover:scale-110 transition-all duration-500">
                      <Upload className="w-10 h-10 text-zinc-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <p className="font-bold text-2xl tracking-tight text-zinc-900">点击上传 <span className="text-zinc-300 font-light">或 拖拽文件</span></p>
                  </div>

                  {originalImage && (
                    <button 
                      onClick={() => setStep(2)}
                      className="w-full bg-zinc-900 text-white h-20 rounded-2xl font-black text-xl flex items-center justify-center gap-4 hover:bg-zinc-800 transition-all shadow-xl active:scale-95 group"
                    >
                      探索视觉风格
                      <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="space-y-3">
                    <span className="inline-block px-3 py-1 bg-purple-50 border border-purple-100 rounded-full text-purple-600 font-mono text-[10px] font-black tracking-widest uppercase">Phase 02</span>
                    <h2 className="text-5xl font-display font-bold tracking-tight text-zinc-900">风格调性</h2>
                    <p className="text-zinc-400 text-sm leading-relaxed">选择一种美学语言，作为我们重塑图像的基调。</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {POSTER_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setSelectedStyle(style)}
                        className={`p-6 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                          selectedStyle.id === style.id 
                            ? 'bg-zinc-900 border-zinc-900 text-white shadow-xl' 
                            : 'bg-white border-zinc-100 hover:border-zinc-200'
                        }`}
                      >
                        <h3 className={`font-bold text-lg mb-2 ${selectedStyle.id === style.id ? 'text-white' : 'text-zinc-900'}`}>{style.name}</h3>
                        <p className={`text-xs leading-relaxed ${selectedStyle.id === style.id ? 'text-white/80' : 'text-zinc-400'}`}>
                          {style.description}
                        </p>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep(1)}
                      className="flex-none w-20 border border-zinc-100 text-zinc-300 rounded-2xl flex items-center justify-center hover:bg-zinc-50 transition-all"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => setStep(3)}
                      className="flex-1 bg-zinc-900 text-white h-20 rounded-2xl font-black text-xl flex items-center justify-center gap-4 hover:bg-zinc-800 transition-all shadow-xl active:scale-95 group"
                    >
                      配置参数
                      <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-10"
                >
                  <div className="space-y-3">
                    <span className="inline-block px-3 py-1 bg-rose-50 border border-rose-100 rounded-full text-rose-600 font-mono text-[10px] font-black tracking-widest uppercase">Phase 03</span>
                    <h2 className="text-5xl font-display font-bold tracking-tight text-zinc-900">构图与引擎</h2>
                    <p className="text-zinc-400 text-sm leading-relaxed">最精细的控制，决定了最终输出的质感。</p>
                  </div>

                  <div className="space-y-8">
                    <div className="group space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300">
                        AI 语义特征修正
                      </label>
                      <textarea 
                        value={analysis}
                        onChange={(e) => setAnalysis(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-6 text-sm focus:outline-none focus:border-indigo-500/50 transition-all min-h-[120px] leading-relaxed text-zinc-700"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300">Canvas Aspect</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['1:1', '3:4', '4:3', '16:9'] as AspectRatio[]).map(r => (
                            <button
                              key={r}
                              onClick={() => setRatio(r)}
                              className={`py-3 px-2 rounded-xl text-xs font-black border transition-all ${
                                ratio === r 
                                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg' 
                                  : 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:border-zinc-200'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300">Rendering Engine</label>
                        <div className="space-y-2">
                          {(['Gemini 3.1', 'Gemini 2.5'] as ModelType[]).map(m => (
                            <button
                              key={m}
                              onClick={() => setModelType(m)}
                              className={`w-full py-3 rounded-xl text-xs font-black border transition-all flex items-center justify-center ${
                                modelType === m 
                                  ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg' 
                                  : 'bg-zinc-50 border-zinc-100 text-zinc-400 hover:border-zinc-200'
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300">Target Resolution</label>
                      <div className="flex gap-3">
                        {(['1K', '2K', '4K'] as Quality[]).map(q => (
                          <button
                            key={q}
                            disabled={modelType === 'Gemini 2.5' && q !== '1K'}
                            onClick={() => setQuality(q)}
                            className={`flex-1 py-4 rounded-2xl text-sm font-black border transition-all ${
                              quality === q && modelType !== 'Gemini 2.5' 
                                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-indigo-400 shadow-lg' 
                                : modelType === 'Gemini 2.5' && q === '1K' 
                                  ? 'bg-zinc-900 text-white border-zinc-900'
                                  : 'bg-zinc-50 border-zinc-100 text-zinc-400 disabled:opacity-30'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-6">
                    <button 
                      onClick={generatePoster}
                      disabled={isGenerating}
                      className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 text-white h-24 rounded-3xl font-black text-2xl flex items-center justify-center gap-4 hover:scale-[1.02] transition-all shadow-2xl disabled:opacity-50 group relative overflow-hidden"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-8 h-8 animate-spin" />
                          正在生成...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-8 h-8" />
                          生成海报
                        </>
                      )}
                    </button>
                    
                    <button 
                      onClick={() => setStep(2)}
                      className="w-full text-zinc-300 hover:text-zinc-900 transition-colors text-[10px] font-black uppercase tracking-[0.5em] py-4"
                    >
                      ← 返回重选风格
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </main>

      <footer className="relative z-10 p-20 text-center border-t border-zinc-100 mt-32">
        <p className="text-[10px] font-mono tracking-[0.6em] uppercase font-black text-zinc-300">AI Post-Production Lab</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }
        .active-nav-indicator {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
}
