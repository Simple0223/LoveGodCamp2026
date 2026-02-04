import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    collection,
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
    increment,
    getDoc
} from 'firebase/firestore';
import {
    getAuth,
    signInAnonymously,
    signInWithCustomToken,
    onAuthStateChanged
} from 'firebase/auth';
import {
    BarChart3,
    Settings,
    Send,
    RefreshCw,
    Users,
    CheckCircle2,
    ExternalLink,
    Copy,
    Plus,
    Trash2,
    Monitor,
    UserCircle
} from 'lucide-react';

// --- Firebase 配置 ---
const firebaseConfig = {
    apiKey: "AIzaSyDSCkqTykcaK3KsKWJVHSqZBJLppuD5yhc",
    authDomain: "live-poll-pro.firebaseapp.com",
    projectId: "live-poll-pro",
    storageBucket: "live-poll-pro.firebasestorage.app",
    messagingSenderId: "433618704198",
    appId: "1:433618704198:web:bb3d52dd398a0c6ed33747",
    measurementId: "G-LHMPWEZV11"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'poll-01';
// --- 子組件：會眾投票介面 ---
const VoterView = ({ pollData, hasVoted, onVote }) => {
    if (!pollData) return <div className="p-8 text-center text-slate-500">等待講者開啟投票中...</div>;

    return (
        <div className="max-w-md mx-auto p-6 space-y-8 animate-in fade-in duration-500 pt-12">
            <header className="text-center space-y-4">
                <div className="inline-block p-4 bg-blue-100 rounded-3xl shadow-inner">
                    <Send className="w-8 h-8 text-blue-600" />
                </div>
                <h1 className="text-3xl font-black text-slate-800 leading-tight">{pollData.question}</h1>
                <p className="text-slate-500 font-medium">一人一票，救救小編（誤）</p>
            </header>

            {!hasVoted ? (
                <div className="grid gap-4">
                    {pollData.options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => onVote(option.id)}
                            className="w-full p-6 text-left bg-white border-b-4 border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-[0.97] active:border-b-0 shadow-sm group"
                        >
                            <span className="text-xl font-bold text-slate-700 group-hover:text-blue-700">{option.text}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-indigo-50 rounded-[2.5rem] border-4 border-white shadow-xl animate-in zoom-in duration-300">
                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-black text-indigo-900">投票成功！</h2>
                    <p className="text-indigo-600 mt-2 px-6 font-medium">感謝你的參與！現在請抬頭看大螢幕，看看神在我們當中的動工（或大家的想法）！</p>
                </div>
            )}
        </div>
    );
};

// --- 子組件：大螢幕顯示介面 ---
const ScreenView = ({ pollData }) => {
    const maxVotes = Math.max(...(pollData?.options?.map(o => o.votes) || [1]), 1);
    const voterUrl = window.location.origin + window.location.pathname;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(voterUrl)}&bgcolor=f8fafc`;

    if (!pollData) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">載入互動資料中...</div>;

    return (
        <div className="min-h-screen bg-[#0f172a] text-white p-12 lg:p-24 flex flex-col overflow-hidden">
            {/* 背景裝飾 */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full -mr-48 -mt-48"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full -ml-48 -mb-48"></div>

            <div className="relative z-10 flex flex-col lg:flex-row gap-20 flex-grow items-center">
                {/* 左側：結果統計 */}
                <div className="flex-grow space-y-12 w-full">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <span className="px-4 py-1.5 bg-blue-500 text-white rounded-full text-xs font-black tracking-[0.2em] uppercase shadow-lg shadow-blue-500/20">Live Interaction</span>
                            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                        </div>
                        <h1 className="text-6xl lg:text-8xl font-black leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            {pollData.question}
                        </h1>
                        <div className="flex items-center gap-6 text-slate-400 text-3xl font-bold">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 flex items-center justify-center text-xs">👤</div>)}
                            </div>
                            <span>{pollData.totalVotes || 0} 位已回應</span>
                        </div>
                    </div>

                    <div className="space-y-10 mt-20">
                        {pollData.options.map((option) => {
                            const percentage = (pollData.totalVotes || 0) > 0
                                ? Math.round((option.votes / pollData.totalVotes) * 100)
                                : 0;

                            return (
                                <div key={option.id} className="group">
                                    <div className="flex justify-between items-end mb-4">
                                        <span className="text-3xl lg:text-4xl font-black group-hover:text-blue-400 transition-colors">{option.text}</span>
                                        <span className="text-4xl font-black text-blue-500 tabular-nums">{percentage}%</span>
                                    </div>
                                    <div className="h-20 w-full bg-slate-800/30 rounded-[1.25rem] overflow-hidden border border-white/5 backdrop-blur-xl relative">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 transition-all duration-1000 ease-out flex items-center justify-end pr-8"
                                            style={{ width: `${(option.votes / maxVotes) * 100}%` }}
                                        >
                                            <span className="text-white text-2xl font-black drop-shadow-md">
                                                {option.votes > 0 ? option.votes : ""}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 右側：QR Code 引導 */}
                <div className="lg:w-[450px] flex flex-col items-center">
                    <div className="bg-white p-10 rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.4),0_0_40px_rgba(37,99,235,0.2)] transform hover:scale-105 transition-all duration-500">
                        <img src={qrUrl} alt="QR Code" className="w-72 h-72 lg:w-80 lg:h-80" />
                        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                            <p className="text-slate-400 font-bold tracking-widest text-sm uppercase">Scan to join</p>
                            <p className="text-slate-900 text-xl font-black mt-1">立即掃描參與互動</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 子組件：後台管理介面 ---
const AdminView = ({ pollData, onUpdate }) => {
    const [q, setQ] = useState(pollData?.question || "");
    const [opts, setOpts] = useState(pollData?.options?.map(o => o.text) || ["", ""]);
    const baseUrl = window.location.origin + window.location.pathname;

    const handleSave = () => {
        if (window.confirm("更新題目將會清空所有數據，確定嗎？")) {
            onUpdate(q, opts.filter(o => o.trim() !== ""));
        }
    };

    const copyToClipboard = (url) => {
        const el = document.createElement('textarea');
        el.value = url;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        alert('連結已複製！');
    };

    return (
        <div className="max-w-4xl mx-auto p-6 lg:p-16 space-y-12">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">後台控制台</h1>
                    <p className="text-slate-500 font-medium">即時控場，掌握聚會節奏</p>
                </div>
                <div className="px-4 py-2 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest">
                    Shekinah Youth
                </div>
            </header>

            {/* 快捷連結 */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="group p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Monitor size={20} /></div>
                        <h3 className="font-bold text-slate-800">大螢幕呈現網址</h3>
                    </div>
                    <div className="flex gap-2">
                        <input readOnly value={`${baseUrl}?view=screen`} className="flex-grow bg-slate-50 p-3 rounded-xl border text-sm text-slate-600" />
                        <button onClick={() => copyToClipboard(`${baseUrl}?view=screen`)} className="p-3 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-xl transition-colors"><Copy size={20} /></button>
                    </div>
                </div>
                <div className="group p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-green-200 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-green-50 text-green-600 rounded-xl"><UserCircle size={20} /></div>
                        <h3 className="font-bold text-slate-800">會眾投票網址</h3>
                    </div>
                    <div className="flex gap-2">
                        <input readOnly value={baseUrl} className="flex-grow bg-slate-50 p-3 rounded-xl border text-sm text-slate-600" />
                        <button onClick={() => copyToClipboard(baseUrl)} className="p-3 bg-slate-100 hover:bg-green-600 hover:text-white rounded-xl transition-colors"><Copy size={20} /></button>
                    </div>
                </div>
            </section>

            {/* 題目編輯器 */}
            <section className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><BarChart3 size={120} /></div>
                <div className="space-y-3 relative z-10">
                    <label className="text-xs font-black text-indigo-500 uppercase tracking-widest">Step 1: 互動的核心</label>
                    <h2 className="text-2xl font-black text-slate-800">你想問大家什麼？</h2>
                    <input
                        className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all text-xl font-bold placeholder:text-slate-300"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="輸入題目，例如：如果你現在有一百萬你會..."
                    />
                </div>

                <div className="space-y-6 relative z-10">
                    <label className="text-xs font-black text-indigo-500 uppercase tracking-widest">Step 2: 選項設計</label>
                    <div className="grid gap-4">
                        {opts.map((opt, i) => (
                            <div key={i} className="flex gap-3 group">
                                <div className="flex-grow relative">
                                    <input
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:outline-none transition-all font-bold"
                                        value={opt}
                                        onChange={(e) => {
                                            const newOpts = [...opts];
                                            newOpts[i] = e.target.value;
                                            setOpts(newOpts);
                                        }}
                                        placeholder={`選項內容 ${i + 1}`}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 font-black italic">{i + 1}</span>
                                </div>
                                {opts.length > 2 && (
                                    <button
                                        onClick={() => setOpts(opts.filter((_, idx) => idx !== i))}
                                        className="p-4 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => setOpts([...opts, ""])}
                        className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all font-bold group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" /> 增加新選項
                    </button>
                </div>

                <button
                    onClick={handleSave}
                    className="w-full py-6 bg-indigo-600 text-white rounded-[1.5rem] font-black text-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-[0.98] flex items-center justify-center gap-4 group"
                >
                    <RefreshCw size={28} className="group-hover:rotate-180 transition-transform duration-700" />
                    立即更新全場畫面
                </button>
            </section>
        </div>
    );
};

// --- 主程式進入點 ---
const App = () => {
    const [view, setView] = useState('vote');
    const [user, setUser] = useState(null);
    const [pollData, setPollData] = useState(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 解析網址參數
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('view');
        if (mode === 'admin') setView('admin');
        else if (mode === 'screen') setView('screen');
        else setView('vote');
    }, []);

    // Firebase 認證 (RULE 3)
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (err) {
                setError("Firebase 連線失敗");
            }
        };
        initAuth();
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            if (u) {
                const voted = localStorage.getItem(`voted_${appId}`);
                if (voted) setHasVoted(true);
            }
        });
        return () => unsubscribe();
    }, []);

    // 訂閱資料 (RULE 1)
    useEffect(() => {
        if (!user) return;
        const pollRef = doc(db, 'artifacts', appId, 'public', 'data', 'polls', 'current');

        const unsubscribe = onSnapshot(pollRef, (docSnap) => {
            if (docSnap.exists()) {
                setPollData(docSnap.data());
            } else {
                const defaultPoll = {
                    question: "你今天來到聚會的心情如何？",
                    options: [
                        { id: '1', text: '充滿期待', votes: 0 },
                        { id: '2', text: '有點疲累', votes: 0 },
                        { id: '3', text: '渴慕遇見神', votes: 0 }
                    ],
                    totalVotes: 0,
                    updatedAt: Date.now()
                };
                setDoc(pollRef, defaultPoll);
                setPollData(defaultPoll);
            }
            setLoading(false);
        }, (err) => setError("讀取失敗: " + err.message));

        return () => unsubscribe();
    }, [user]);

    const handleVote = async (optionId) => {
        if (hasVoted || !user || !pollData) return;
        try {
            const pollRef = doc(db, 'artifacts', appId, 'public', 'data', 'polls', 'current');
            const updatedOptions = pollData.options.map(opt => ({
                ...opt,
                votes: opt.id === optionId ? (opt.votes || 0) + 1 : (opt.votes || 0)
            }));
            await updateDoc(pollRef, {
                options: updatedOptions,
                totalVotes: increment(1),
                updatedAt: Date.now()
            });
            setHasVoted(true);
            localStorage.setItem(`voted_${appId}`, 'true');
        } catch (err) { console.error(err); }
    };

    const handleUpdatePoll = async (newQuestion, newOptionsArray) => {
        const pollRef = doc(db, 'artifacts', appId, 'public', 'data', 'polls', 'current');
        const newOptions = newOptionsArray.map((text, index) => ({
            id: String(index + 1),
            text,
            votes: 0
        }));
        await setDoc(pollRef, {
            question: newQuestion,
            options: newOptions,
            totalVotes: 0,
            updatedAt: Date.now()
        });
        setHasVoted(false);
        localStorage.removeItem(`voted_${appId}`);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 font-black text-indigo-900 tracking-widest uppercase text-sm">Loading Shekinah Poll...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100">

            {/* 🟢 工具列已移除，現在只能透過網址參數切換（例如 ?view=admin） */}

            <main className="min-h-screen">
                {view === 'vote' && <VoterView pollData={pollData} hasVoted={hasVoted} onVote={handleVote} />}
                {view === 'screen' && <ScreenView pollData={pollData} />}
                {view === 'admin' && <AdminView pollData={pollData} onUpdate={handleUpdatePoll} />}
            </main>

            <style dangerouslySetInnerHTML={{
                __html: `
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&display=swap');
        body { font-family: 'Noto Sans TC', sans-serif; }
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes zoom-in { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-in { animation-fill-mode: both; }
        .fade-in { animation-name: fade-in; }
        .zoom-in { animation-name: zoom-in; }
      `}} />
        </div>
    );
};

export default App;

