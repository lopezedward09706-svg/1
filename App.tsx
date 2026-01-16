
import React, { useState, useEffect, useCallback } from 'react';
import { BranchType, ParticleType, Knot, ChatMessage } from './types';
import SimulationCanvas from './components/SimulationCanvas';
import { askTheory, generateTheorySpeech } from './services/geminiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const App: React.FC = () => {
  const [branch, setBranch] = useState<BranchType>(BranchType.C_CONSTANT);
  const [knots, setKnots] = useState<Knot[]>([
    { id: '1', type: ParticleType.PROTON, position: [0, 0, 0], mass: 10, chirality: 1 }
  ]);
  const [showTorsion, setShowTorsion] = useState(false);
  const [showStringDensity, setShowStringDensity] = useState(false);
  
  // AI Sidebar
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', content: "Welcome to the R-QNT Research Lab. How can I assist your theoretical exploration today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Analysis Data
  const [analysisData, setAnalysisData] = useState<{r: number, c: number}[]>([]);

  useEffect(() => {
    // Generate data for the c-local vs Radius plot
    const data = [];
    for (let r = 1; r < 20; r += 0.5) {
      const c = branch === BranchType.C_VARIABLE ? Math.sqrt(1 - 1/(r+1)) : 1.0;
      data.push({ r, c });
    }
    setAnalysisData(data);
  }, [branch]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoadingAI(true);

    try {
      const answer = await askTheory(input);
      setMessages(prev => [...prev, { role: 'model', content: answer }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', content: "Error communicating with the physics module." }]);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const addParticle = (type: ParticleType) => {
    const newKnot: Knot = {
      id: Math.random().toString(36),
      type,
      position: [(Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10],
      mass: type === ParticleType.ELECTRON ? 1 : 10,
      chirality: type === ParticleType.PROTON ? 1 : type === ParticleType.ELECTRON ? -1 : 0
    };
    setKnots(prev => [...prev, newKnot]);
  };

  const clearParticles = () => setKnots([]);

  const handleTTS = async (text: string) => {
    await generateTheorySpeech(text);
  };

  return (
    <div className="flex h-screen w-screen bg-[#050505] overflow-hidden text-slate-200">
      {/* Sidebar: Controls */}
      <aside className="w-80 border-r border-slate-800 flex flex-col p-6 space-y-8 bg-slate-950/50 backdrop-blur-xl">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-blue-500">R-QNT</span> Engine
          </h1>
          <p className="text-xs text-slate-500 uppercase font-semibold">Theoretical Framework V3.1</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-400">Theory Branch</h2>
          <div className="flex bg-slate-900 rounded-lg p-1">
            <button 
              onClick={() => setBranch(BranchType.C_CONSTANT)}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${branch === BranchType.C_CONSTANT ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Rama-C
            </button>
            <button 
              onClick={() => setBranch(BranchType.C_VARIABLE)}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${branch === BranchType.C_VARIABLE ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Rama-V
            </button>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed italic">
            {branch === BranchType.C_CONSTANT 
              ? "Relativity is effective; light speed is a network limit." 
              : "Light speed varies with local network stiffness (k)."}
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-400">Particle Laboratory</h2>
          <div className="grid grid-cols-1 gap-2">
            <button onClick={() => addParticle(ParticleType.PROTON)} className="flex items-center justify-between px-4 py-2 bg-red-900/20 border border-red-900/30 rounded-lg text-red-400 hover:bg-red-900/30 transition-colors">
              <span className="text-xs">Add Proton</span>
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>
            <button onClick={() => addParticle(ParticleType.ELECTRON)} className="flex items-center justify-between px-4 py-2 bg-blue-900/20 border border-blue-900/30 rounded-lg text-blue-400 hover:bg-blue-900/30 transition-colors">
              <span className="text-xs">Add Electron</span>
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
            </button>
            <button onClick={() => addParticle(ParticleType.NEUTRON)} className="flex items-center justify-between px-4 py-2 bg-emerald-900/20 border border-emerald-900/30 rounded-lg text-emerald-400 hover:bg-emerald-900/30 transition-colors">
              <span className="text-xs">Add Neutron</span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            </button>
          </div>
          <button onClick={clearParticles} className="w-full py-2 text-[10px] text-slate-500 hover:text-white transition-colors uppercase tracking-widest border border-dashed border-slate-800 rounded">
            Reset Network
          </button>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-400">Visualization</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={showTorsion} onChange={e => setShowTorsion(e.target.checked)} className="form-checkbox bg-slate-800 border-slate-700 text-blue-500 rounded" />
              <span className="text-xs text-slate-300 group-hover:text-white">Vector Torsion Fields</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={showStringDensity} onChange={e => setShowStringDensity(e.target.checked)} className="form-checkbox bg-slate-800 border-slate-700 text-blue-500 rounded" />
              <span className="text-xs text-slate-300 group-hover:text-white">Network Tension Maps</span>
            </label>
          </div>
        </section>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        <div className="flex-1 relative">
          <SimulationCanvas 
            branch={branch}
            knots={knots}
            showTorsion={showTorsion}
            showStringDensity={showStringDensity}
          />
          
          {/* Overlay Stats */}
          <div className="absolute top-6 left-6 p-4 bg-slate-950/80 border border-slate-800 rounded-xl backdrop-blur-md pointer-events-none">
            <div className="text-[10px] uppercase text-slate-500 font-bold mb-2">Live Telemetry</div>
            <div className="flex gap-8">
              <div>
                <div className="text-lg font-mono text-blue-400">{knots.length}</div>
                <div className="text-[10px] text-slate-500">Knot Count</div>
              </div>
              <div>
                <div className="text-lg font-mono text-purple-400">{branch === BranchType.C_VARIABLE ? 'Var' : 'Const'}</div>
                <div className="text-[10px] text-slate-500">Branch Mode</div>
              </div>
              <div>
                <div className="text-lg font-mono text-emerald-400">0.02s</div>
                <div className="text-[10px] text-slate-500">Lattice Delta</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Panel: Analytics & Plots */}
        <div className="h-48 border-t border-slate-800 bg-slate-950 flex p-4 gap-6">
          <div className="w-1/3 flex flex-col">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-widest">Shapiro Delay Profile</h3>
            <div className="flex-1 min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analysisData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="r" stroke="#475569" fontSize={8} label={{ value: 'Radius', position: 'insideBottom', offset: -5, fontSize: 8, fill: '#475569' }} />
                  <YAxis stroke="#475569" fontSize={8} domain={[0, 1.1]} label={{ value: 'C-Local', angle: -90, position: 'insideLeft', fontSize: 8, fill: '#475569' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="c" stroke={branch === BranchType.C_VARIABLE ? "#a855f7" : "#3b82f6"} dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-center border-l border-slate-900 pl-6">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">Calculated Metrics</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-[10px] text-slate-400">Planck Tension (Tp)</span>
                <span className="text-[10px] font-mono">4.8e41 N</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-[10px] text-slate-400">Elastic Modulus (Ke)</span>
                <span className="text-[10px] font-mono">1.025</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-[10px] text-slate-400">Torsion Delta</span>
                <span className="text-[10px] font-mono">Δτ ≈ 1.0</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-[10px] text-slate-400">Proper Time Ratio</span>
                <span className="text-[10px] font-mono">0.99988</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* AI Research Side Panel */}
      <aside className="w-96 border-l border-slate-800 bg-slate-950 flex flex-col shadow-2xl z-50">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Physics Researcher</h3>
          </div>
          <button className="text-slate-500 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-slate-900 text-slate-300 rounded-bl-none border border-slate-800 shadow-lg'
              }`}>
                {msg.content}
                {msg.role === 'model' && (
                  <button 
                    onClick={() => handleTTS(msg.content)}
                    className="mt-2 text-[8px] text-slate-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.984 3.984 0 00-1.172-2.828a1 1 0 010-1.415z" /></svg>
                    Listen to synthesis
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoadingAI && (
            <div className="flex gap-2 p-2 items-center text-slate-500 italic text-[10px]">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" />
                <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
              Calculating topological invariants...
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900/50 border-t border-slate-800">
          <div className="relative">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder="Ask about Torsion Potential..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition-all resize-none min-h-[80px]"
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoadingAI}
              className="absolute bottom-3 right-3 p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white disabled:opacity-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
          </div>
          <p className="text-[9px] text-slate-600 mt-2 text-center">Powered by Gemini 3 Pro • Thinking Enabled</p>
        </div>
      </aside>
    </div>
  );
};

export default App;
