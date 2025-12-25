
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeft, Send, Sparkles, MoreVertical,
    Calendar, MapPin, Clock, Check, X,
    Plus, Activity, ShieldAlert, Image as ImageIcon,
    Bot, Dumbbell, Camera, Flame, ChevronLeft, ChevronRight, Navigation, Shield, AlertCircle
} from 'lucide-react';
import { GlassInput, GlassButton, GlassSelectable } from '../components/ui/Glass';
import { ReportModal } from '../components/modals/ReportModal';
import { generateIcebreaker, checkSafety, generateStructuredWorkout, analyzeImage } from '../services/geminiService';
import { notificationService } from '../services/notificationService';
import { chatService } from '../services/chatService';
import { requestService } from '../services/requestService';
import { realtimeManager } from '../services/realtimeManager';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { Message, SportType, User, ActivityRequest } from '../types';
import { hapticFeedback } from '../services/hapticService';
import { useTheme } from '../context/ThemeContext';
import { analytics, ANALYTICS_EVENTS } from '../utils/analytics';

// --- Helper Data ---
const NEARBY_SPOTS = [
    { name: "Central Park Loop", dist: "0.5km", type: "Running" },
    { name: "City Tennis Courts", dist: "1.2km", type: "Tennis" },
    { name: "Iron Paradise Gym", dist: "2.0km", type: "Gym" },
    { name: "Riverfront Yoga Spot", dist: "3.5km", type: "Yoga" },
    { name: "Community Center", dist: "4.1km", type: "General" }
];

// --- Helper Components ---

const MessageBubble: React.FC<{
    msg: Message,
    isMe: boolean,
    isLight: boolean,
    isAi: boolean,
    partnerName?: string
}> = ({ msg, isMe, isLight, isAi, partnerName }) => {

    // Render Invite Card
    if (msg.type === 'invite' && msg.inviteDetails) {
        return (
            <div className={`p-1 rounded-[24px] overflow-hidden shadow-lg max-w-[280px] ${isMe ? 'bg-neon-blue/10 border-neon-blue/30' : (isLight ? 'bg-white' : 'bg-white/10')} border`}>
                <div className={`p-4 ${isMe ? 'bg-neon-blue text-black' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'} relative overflow-hidden`}>
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/20 rounded-full blur-xl"></div>
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                        <Calendar size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">Workout Invite</span>
                    </div>
                    <h3 className="font-display font-bold text-lg leading-tight mb-3">
                        {msg.inviteDetails.activity}
                    </h3>
                    <div className="space-y-1 text-xs font-medium opacity-90">
                        <div className="flex items-center gap-2">
                            <Clock size={12} /> {msg.inviteDetails.date} @ {msg.inviteDetails.time}
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin size={12} /> {msg.inviteDetails.location}
                        </div>
                    </div>
                </div>
                <div className={`p-3 text-center text-[10px] font-bold uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                    {isMe ? 'Request Sent' : 'Tap to View'}
                </div>
            </div>
        );
    }

    // Render WorkoutCard if message contains workout plan
    if ((msg as any).workoutPlan) {
        return (
            <div className="max-w-[85%]">
                {!isMe && (
                    <span className={`text-[9px] font-bold mb-1 block opacity-50 ${isLight ? 'text-slate-500' : 'text-white'}`}>
                        {isAi ? 'AI Coach' : partnerName}
                    </span>
                )}
                <WorkoutCard plan={(msg as any).workoutPlan} isLight={isLight} />
            </div>
        );
    }

    // Standard Text Bubble
    return (
        <div className={`
            relative px-5 py-3 text-sm shadow-sm max-w-[75%] group transition-all duration-200
            ${msg.image ? 'p-2' : ''}
            ${isMe
                ? 'bg-neon-blue text-black font-medium rounded-[20px] rounded-br-sm ml-auto'
                : isAi
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-[20px] rounded-bl-sm border border-white/10'
                    : (isLight ? 'bg-white text-slate-800 border border-slate-100 rounded-[20px] rounded-bl-sm' : 'bg-[#27272a] text-white border border-white/10 rounded-[20px] rounded-bl-sm')
            }
        `}>
            {/* Sender Name for Group/AI context */}
            {!isMe && (
                <span className={`text-[9px] font-bold absolute -top-5 left-2 opacity-50 ${isLight ? 'text-slate-500' : 'text-white'}`}>
                    {isAi ? 'AI Coach' : partnerName}
                </span>
            )}

            {/* Image Attachment */}
            {msg.image && (
                <div className="mb-2 rounded-xl overflow-hidden">
                    <img src={msg.image} alt="Attachment" className="w-full h-auto max-h-48 object-cover" />
                </div>
            )}

            {/* Text Content */}
            <div className={msg.image ? "px-2 pb-2" : ""}>
                {msg.text.split('\n').map((line, i) => (
                    <p key={i} className={`min-h-[1rem] ${i > 0 ? 'mt-1' : ''}`}>{line}</p>
                ))}
            </div>

            {/* Timestamp */}
            <div className={`text-[9px] font-bold mt-1 flex items-center gap-1 opacity-40 justify-end ${isMe ? 'text-black' : 'text-current'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {isMe && <Check size={10} strokeWidth={3} />}
            </div>
        </div>
    );
};

// Action Button Component matching the design
const ActionButton: React.FC<{
    icon: any,
    label: string,
    colorClass: string,
    iconColor: string,
    onClick: () => void,
    disabled?: boolean
}> = ({ icon: Icon, label, colorClass, iconColor, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex flex-col items-center justify-center gap-2 group transition-all active:scale-95 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 ${colorClass}`}>
            <Icon size={28} className={iconColor} strokeWidth={1.5} />
        </div>
        <span className="text-[11px] font-bold text-white/80 tracking-wide">{label}</span>
    </button>
);

// New Chatbot Question Component
const ChatbotQuestion: React.FC<{
    question: string,
    options: string[],
    onSelect: (option: string) => void,
    onBack: () => void
}> = ({ question, options, onSelect, onBack }) => (
    <div className="animate-slide-up w-full">
        <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft size={20} className="text-white/60" />
            </button>
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Bot size={16} className="text-white" />
                </div>
                <div className="bg-white/10 border border-white/5 px-4 py-2 rounded-[16px] rounded-bl-sm text-sm text-white/90 font-medium">
                    {question}
                </div>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-2 pl-11">
            {options.map((opt) => (
                <button
                    key={opt}
                    onClick={() => onSelect(opt)}
                    className="py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold transition-all active:scale-95 text-left flex items-center justify-between group"
                >
                    {opt}
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity -mr-1" />
                </button>
            ))}
        </div>
    </div>
);

// WorkoutCard Component for interactive workout plans
const WorkoutCard: React.FC<{ plan: any, isLight: boolean }> = ({ plan, isLight }) => {
    const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

    const toggleCheck = (index: number) => {
        setCheckedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const allChecked = checkedItems.size === plan.exercises.length;
    const completionPercent = Math.round((checkedItems.size / plan.exercises.length) * 100);

    return (
        <div className={`p-4 rounded-2xl border ${isLight
            ? 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200'
            : 'bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border-blue-800'
            }`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Dumbbell className={isLight ? 'text-blue-600' : 'text-blue-400'} size={20} />
                    <h4 className={`font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                        {plan.title}
                    </h4>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${plan.difficulty === 'Beginner'
                    ? isLight ? 'bg-green-100 text-green-700' : 'bg-green-900/50 text-green-300'
                    : plan.difficulty === 'Intermediate'
                        ? isLight ? 'bg-yellow-100 text-yellow-700' : 'bg-yellow-900/50 text-yellow-300'
                        : isLight ? 'bg-red-100 text-red-700' : 'bg-red-900/50 text-red-300'
                    }`}>
                    {plan.difficulty}
                </span>
            </div>

            <div className={`text-sm mb-3 ${isLight ? 'text-gray-600' : 'text-gray-300'}`}>
                <p><strong>Focus:</strong> {plan.focus}</p>
                <p><strong>Duration:</strong> {plan.duration}</p>
            </div>

            <div className="space-y-2">
                {plan.exercises.map((exercise: any, idx: number) => (
                    <div
                        key={idx}
                        onClick={() => toggleCheck(idx)}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${checkedItems.has(idx)
                            ? isLight ? 'bg-green-100 border border-green-300' : 'bg-green-900/30 border border-green-700'
                            : isLight ? 'bg-white border border-gray-200 hover:bg-gray-50' : 'bg-gray-800/50 border border-gray-700 hover:bg-gray-800'
                            }`}
                    >
                        <div className={`flex-shrink-0 mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${checkedItems.has(idx)
                            ? isLight ? 'bg-green-500 border-green-500' : 'bg-green-600 border-green-600'
                            : isLight ? 'border-gray-300' : 'border-gray-600'
                            }`}>
                            {checkedItems.has(idx) && <Check size={14} className="text-white" />}
                        </div>
                        <div className="flex-1">
                            <p className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'} ${checkedItems.has(idx) ? 'line-through opacity-70' : ''}`}>
                                {exercise.name}
                            </p>
                            <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                                {exercise.sets} sets × {exercise.reps} reps
                                {exercise.rest && ` • Rest: ${exercise.rest}`}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {allChecked && (
                <div className={`mt-3 p-3 rounded-lg text-center ${isLight ? 'bg-green-100 border border-green-300' : 'bg-green-900/30 border border-green-700'
                    }`}>
                    <p className={`font-semibold ${isLight ? 'text-green-700' : 'text-green-300'}`}>
                        🎉 Workout Complete! Great job!
                    </p>
                </div>
            )}

            {!allChecked && (
                <div className="mt-3 flex items-center gap-2">
                    <div className={`flex-1 h-2 rounded-full overflow-hidden ${isLight ? 'bg-gray-200' : 'bg-gray-700'
                        }`}>
                        <div
                            className={`h-full transition-all ${isLight ? 'bg-blue-600' : 'bg-blue-400'
                                }`}
                            style={{ width: `${completionPercent}%` }}
                        />
                    </div>
                    <span className={`text-xs font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        {checkedItems.size} / {plan.exercises.length} Completed
                    </span>
                </div>
            )}
        </div>
    );
};

export const Chat: React.FC = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { theme } = useTheme();
    const isLight = theme === 'light';

    // Data State
    const [messages, setMessages] = useState<Message[]>([]);
    const [partner, setPartner] = useState<Partial<User> | null>(null);
    const [inputMessage, setInputMessage] = useState('');
    const [showSafetyTip, setShowSafetyTip] = useState(true);
    const [aiTypingText, setAiTypingText] = useState<string>('');

    // UI State
    const [showActions, setShowActions] = useState(false);
    const [actionStep, setActionStep] = useState<'menu' | 'plan_sport' | 'icebreaker_vibe' | 'create_invite' | 'pick_location'>('menu');

    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isLoadingAi, setIsLoadingAi] = useState(false);
    const [isAiTyping, setIsAiTyping] = useState(false);

    // Invite Form State
    const [inviteData, setInviteData] = useState({
        sport: SportType.RUNNING,
        date: '',
        time: '',
        location: ''
    });

    // Vision/File State
    const [showVisionPreview, setShowVisionPreview] = useState(false);
    const [visionImage, setVisionImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Initialize Partner Data (Robust loading)
    useEffect(() => {
        const loadPartner = async () => {
            // Try to get from navigation state first (fastest)
            if (location.state?.user) {
                setPartner(location.state.user);
                return;
            }

            // Fallback to Supabase fetch if refreshed
            if (userId) {
                try {
                    const userData = await userService.getUserById(userId);
                    if (userData) {
                        setPartner(userData);
                    } else {
                        // Fallback to minimal data
                        setPartner({
                            id: userId,
                            name: 'User',
                            avatarUrl: 'https://i.pravatar.cc/150',
                            interests: [SportType.GYM, SportType.RUNNING]
                        });
                    }
                } catch (e) {
                    console.error("Error loading partner", e);
                }
            }
        };
        loadPartner();
    }, [userId, location.state]);

    // 2. Subscribe to Real-time Chat (Supabase)
    useEffect(() => {
        if (!user || !userId) return;

        // Use realtimeManager for subscription management
        const subscriptionKey = realtimeManager.subscribeToMessages(
            user.id,
            userId,
            (newMessages) => {
                setMessages(newMessages);
                scrollToBottom();
            }
        );

        // Mark messages as read when viewing
        chatService.markAsRead(user.id, userId);

        return () => {
            realtimeManager.unsubscribe(subscriptionKey);
        };
    }, [user, userId]);

    // Safety tip disappears after 12 seconds
    useEffect(() => {
        if (showSafetyTip) {
            const timer = setTimeout(() => {
                setShowSafetyTip(false);
            }, 12000);
            return () => clearTimeout(timer);
        }
    }, [showSafetyTip]);

    // 3. Scroll handling
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    // Reset action step when closing menu
    useEffect(() => {
        if (!showActions) {
            setTimeout(() => setActionStep('menu'), 300);
        }
    }, [showActions]);

    // Handlers
    const handleSendMessage = async (type: 'text' | 'invite' = 'text', payload?: any) => {
        if (type === 'text' && !inputMessage.trim() && !visionImage) return;
        if (!user || !userId) return;

        hapticFeedback.light();

        // Safety Check for text
        if (type === 'text' && inputMessage) {
            const isSafe = await checkSafety(inputMessage);
            if (!isSafe) {
                hapticFeedback.error();
                notificationService.showNotification("Message Blocked", { body: "Content flagged as unsafe." });
                return;
            }
        }

        // Prepare Message Data
        const textToSend = inputMessage;
        const imageToSend = visionImage;

        // Clear Input immediately for UX
        setInputMessage('');
        setVisionImage(null);
        setShowVisionPreview(false);
        setShowActions(false);

        // Send via Supabase Service
        const metadata = {
            ...payload,
            ...(imageToSend && { image: imageToSend })
        };

        await chatService.sendMessage(user.id, userId, textToSend, type, metadata);

        // Track message sent event
        analytics.track(ANALYTICS_EVENTS.MESSAGE_SENT, {
            recipientId: userId,
            messageType: type,
            hasImage: !!imageToSend
        });

        // If image was sent, trigger AI analysis (Vision Coach feature)
        if (imageToSend) {
            handleVisionAnalysis(imageToSend, textToSend);
        }
    };

    const handleVisionAnalysis = async (image: string, prompt: string) => {
        setIsAiTyping(true);
        try {
            const analysis = await analyzeImage(image, prompt || "What is this?");
            await chatService.sendMessage('ai-assistant', userId!, analysis, 'text', { isAiGenerated: true });
        } catch (e) {
            console.error(e);
        } finally {
            setIsAiTyping(false);
        }
    };

    const handleAiIcebreakerSelection = async (vibe: string) => {
        if (!user || !partner) return;
        hapticFeedback.medium();
        setIsLoadingAi(true);
        setShowActions(false); // Close menu to show loading clearly or typing

        try {
            const text = await generateIcebreaker(user, partner as User, vibe);
            setInputMessage(text);
        } finally {
            setIsLoadingAi(false);
        }
    };

    const handleAiPlanSelection = async (sport: string) => {
        if (!user || !partner) return;
        hapticFeedback.medium();

        // Close menu and show AI typing with descriptive text
        setShowActions(false);
        setIsAiTyping(true);
        setAiTypingText('Drafting workout plan...');

        try {
            const workoutPlan = await generateStructuredWorkout(user, partner, sport);

            // Send as a message with workoutPlan embedded
            const messageData: any = {
                id: Date.now().toString(),
                senderId: 'ai-assistant',
                recipientId: user.id,
                text: '', // Empty text since we have workoutPlan
                timestamp: new Date(),
                isAiGenerated: true,
                workoutPlan: workoutPlan
            };

            await chatService.sendMessage('ai-assistant', userId!, '', 'text', {
                isAiGenerated: true,
                workoutPlan: workoutPlan
            });
        } finally {
            setIsAiTyping(false);
            setAiTypingText('');
        }
    };

    const handleSendInvite = () => {
        hapticFeedback.medium();
        // Pre-fill if partner has interests
        if (partner?.interests?.[0]) {
            setInviteData(prev => ({ ...prev, sport: partner.interests[0] }));
        }
        setActionStep('create_invite');
    };

    const handleLocationSelect = (spotName: string) => {
        hapticFeedback.medium();
        setInviteData({ ...inviteData, location: spotName });
        setActionStep('create_invite');
    };

    const submitInvite = async () => {
        if (!user || !userId || !partner) return;

        if (!inviteData.date || !inviteData.time || !inviteData.location) {
            hapticFeedback.error();
            notificationService.showNotification("Missing Info", { body: "Please fill in all invite details." });
            return;
        }

        hapticFeedback.success();

        // Format date cleanly
        const dateObj = new Date(inviteData.date);
        const formattedDate = isNaN(dateObj.getTime())
            ? inviteData.date
            : dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

        // 1. Create Request Object for Matches Tab
        const newRequest: ActivityRequest = {
            id: Date.now().toString(),
            senderId: user.id,
            senderName: user.name,
            senderAvatar: user.avatarUrl,
            receiverId: userId,
            sport: inviteData.sport,
            date: formattedDate,
            time: inviteData.time,
            location: inviteData.location,
            status: 'pending',
            timestamp: new Date()
        };

        // 2. Save to Persistence (for Matches Tab)
        await requestService.sendRequest(newRequest);

        // 3. Send Chat Message
        await handleSendMessage('invite', {
            inviteDetails: {
                activity: inviteData.sport,
                date: formattedDate,
                time: inviteData.time,
                location: inviteData.location,
                status: 'pending'
            }
        });

        // Reset
        setInviteData({ sport: SportType.RUNNING, date: '', time: '', location: '' });
        setActionStep('menu');
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setVisionImage(ev.target?.result as string);
                setShowVisionPreview(true);
                setShowActions(false);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    return (
        <div className="flex flex-col h-screen w-full bg-transparent overflow-hidden relative">

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

            {/* 1. HEADER - Fixed at top */}
            <div className={`
            flex-none px-4 py-3 pt-safe-top flex items-center justify-between z-30 backdrop-blur-xl border-b transition-colors
            ${isLight ? 'bg-white/80 border-slate-200' : 'bg-black/60 border-white/10'}
        `}>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className={`p-2 rounded-full ${isLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-white/10 text-white'}`}>
                        <ArrowLeft size={22} />
                    </button>

                    {/* User Info */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/matches/${userId}`)}>
                        <div className="relative">
                            <img
                                src={partner?.avatarUrl || 'https://i.pravatar.cc/150'}
                                className="w-10 h-10 rounded-full object-cover border border-white/10"
                                alt=""
                            />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
                        </div>
                        <div>
                            <h3 className={`font-bold text-sm leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                {partner?.name || 'Loading...'}
                            </h3>
                            <div className="flex items-center gap-1 text-[10px] opacity-60">
                                {partner?.interests?.[0] ? partner.interests[0] : 'Active'}
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => setIsReportModalOpen(true)}
                    className={`p-2 rounded-full ${isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/10 text-white/40'}`}
                >
                    <ShieldAlert size={20} />
                </button>
            </div>

            {/* Safety Tip Banner */}
            {showSafetyTip && (
                <div className={`mx-4 mt-3 p-3 rounded-xl border flex items-start gap-3 ${isLight
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-blue-900/20 border-blue-800 text-blue-300'
                    }`}>
                    <Shield size={18} className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs">
                        <strong>Safety First:</strong> Never share personal info or meet privately without telling someone.
                    </p>
                </div>
            )}

            {/* 2. MESSAGES AREA - Flex Grow with internal Scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar relative z-10">
                {aiTypingText && (
                    <div className="flex items-center gap-2 text-sm mb-2 animate-slide-up">
                        <div className={`px-3 py-2 rounded-lg ${isLight ? 'bg-gray-100 text-gray-600' : 'bg-gray-800 text-gray-300'}`}>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span>{aiTypingText}</span>
                            </div>
                        </div>
                    </div>
                )}
                {messages.map((msg, idx) => (
                    <div key={msg.id} className={`flex w-full ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                        <MessageBubble
                            msg={msg}
                            isMe={msg.senderId === user?.id}
                            isLight={isLight}
                            isAi={msg.senderId === 'ai-assistant'}
                            partnerName={partner?.name}
                        />
                    </div>
                ))}

                {/* AI Typing Indicator */}
                {isAiTyping && (
                    <div className="flex justify-start animate-slide-up">
                        <div className={`px-4 py-3 rounded-[20px] rounded-bl-sm bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center gap-1`}>
                            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-75"></div>
                            <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-150"></div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* 3. VISION PREVIEW OVERLAY */}
            {showVisionPreview && visionImage && (
                <div className="absolute bottom-24 left-4 right-4 z-40 animate-slide-up">
                    <div className="bg-[#18181b] border border-white/10 p-3 rounded-2xl shadow-2xl flex gap-3 items-center">
                        <img src={visionImage} className="w-12 h-12 rounded-lg object-cover bg-black" alt="Preview" />
                        <div className="flex-1">
                            <div className="text-xs font-bold text-white mb-1">Image attached</div>
                            <div className="text-[10px] text-white/50">AI will analyze this image</div>
                        </div>
                        <button onClick={() => { setVisionImage(null); setShowVisionPreview(false); }} className="p-2 bg-white/10 rounded-full">
                            <X size={16} className="text-white" />
                        </button>
                    </div>
                </div>
            )}

            {/* 4. ACTION MENU DRAWER (Interactive) */}
            {showActions && (
                <div className="absolute bottom-24 left-4 right-4 z-40 animate-slide-up origin-bottom">
                    <div className="bg-[#1e1e24]/95 backdrop-blur-2xl border border-white/10 p-6 rounded-[32px] shadow-2xl transition-all duration-300">

                        {/* STEP: MAIN MENU */}
                        {actionStep === 'menu' && (
                            <div className="grid grid-cols-4 gap-4">
                                <ActionButton
                                    icon={Calendar}
                                    label="Invite"
                                    colorClass="bg-blue-500/20 border border-blue-500/30"
                                    iconColor="text-blue-400"
                                    onClick={handleSendInvite}
                                />

                                <ActionButton
                                    icon={Sparkles}
                                    label="Icebreaker"
                                    colorClass="bg-purple-500/20 border border-purple-500/30"
                                    iconColor="text-purple-400"
                                    onClick={() => setActionStep('icebreaker_vibe')}
                                    disabled={isLoadingAi}
                                />

                                <ActionButton
                                    icon={Activity}
                                    label="AI Plan"
                                    colorClass="bg-green-500/20 border border-green-500/30"
                                    iconColor="text-green-400"
                                    onClick={() => setActionStep('plan_sport')}
                                />

                                <ActionButton
                                    icon={ImageIcon}
                                    label="Vision"
                                    colorClass="bg-amber-500/20 border border-amber-500/30"
                                    iconColor="text-amber-400"
                                    onClick={() => fileInputRef.current?.click()}
                                />
                            </div>
                        )}

                        {/* STEP: PLAN SELECTION */}
                        {actionStep === 'plan_sport' && (
                            <ChatbotQuestion
                                question="Which sport do you want a plan for?"
                                options={['Gym 💪', 'Running 🏃', 'Tennis 🎾', 'Yoga 🧘', 'Crossfit 🏋️']}
                                onSelect={handleAiPlanSelection}
                                onBack={() => setActionStep('menu')}
                            />
                        )}

                        {/* STEP: ICEBREAKER SELECTION */}
                        {actionStep === 'icebreaker_vibe' && (
                            <ChatbotQuestion
                                question="What's the vibe?"
                                options={['Funny 😂', 'Casual 👋', 'Flirty 😉', 'Competitive 🏆', 'Direct 🎯']}
                                onSelect={handleAiIcebreakerSelection}
                                onBack={() => setActionStep('menu')}
                            />
                        )}

                        {/* STEP: LOCATION PICKER (MAP) */}
                        {actionStep === 'pick_location' && (
                            <div className="animate-slide-up space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <button onClick={() => setActionStep('create_invite')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                        <ChevronLeft size={20} className="text-white/60" />
                                    </button>
                                    <span className="text-white font-bold text-sm">Select Location</span>
                                </div>

                                {/* Simulated Map View */}
                                <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-gray-800 border border-white/10">
                                    <svg width="100%" height="100%" className="absolute inset-0">
                                        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                                        </pattern>
                                        <rect width="100%" height="100%" fill="url(#grid)" />
                                    </svg>
                                    {/* Fake Pins */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-neon-blue">
                                        <MapPin size={32} fill="currentColor" className="drop-shadow-lg" />
                                    </div>
                                    <div className="absolute top-1/4 left-1/4 text-white/30"><MapPin size={16} /></div>
                                    <div className="absolute bottom-1/4 right-1/3 text-white/30"><MapPin size={16} /></div>
                                    <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded text-[9px] text-white/70 backdrop-blur-sm">Map Preview</div>
                                </div>

                                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                                    {NEARBY_SPOTS.map((spot, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleLocationSelect(spot.name)}
                                            className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 flex items-center justify-between transition-colors group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-neon-blue/10 flex items-center justify-center text-neon-blue">
                                                    <MapPin size={14} />
                                                </div>
                                                <div className="text-left">
                                                    <div className="text-xs font-bold text-white">{spot.name}</div>
                                                    <div className="text-[10px] text-white/50">{spot.type} • {spot.dist}</div>
                                                </div>
                                            </div>
                                            <ChevronRight size={14} className="text-white/20 group-hover:text-white/60" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP: CREATE INVITE FORM */}
                        {actionStep === 'create_invite' && (
                            <div className="animate-slide-up space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setActionStep('menu')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                            <ChevronLeft size={20} className="text-white/60" />
                                        </button>
                                        <span className="text-white font-bold text-sm">Create Invite</span>
                                    </div>
                                    <button onClick={() => setShowActions(false)}><X size={18} className="text-white/50" /></button>
                                </div>

                                {/* Sport Selector */}
                                <div>
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 block ml-1">Activity</label>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                        {Object.values(SportType).map(s => (
                                            <GlassSelectable
                                                key={s}
                                                selected={inviteData.sport === s}
                                                onClick={() => setInviteData({ ...inviteData, sport: s })}
                                                className="!py-2 !px-3 !text-[10px] whitespace-nowrap"
                                            >
                                                {s}
                                            </GlassSelectable>
                                        ))}
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1 block ml-1">Date</label>
                                        <GlassInput
                                            type="date"
                                            value={inviteData.date}
                                            onChange={e => setInviteData({ ...inviteData, date: e.target.value })}
                                            className="!py-2 !text-xs bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1 block ml-1">Time</label>
                                        <GlassInput
                                            type="time"
                                            value={inviteData.time}
                                            onChange={e => setInviteData({ ...inviteData, time: e.target.value })}
                                            className="!py-2 !text-xs bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                </div>

                                {/* Location Input with Map Trigger */}
                                <div>
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1 block ml-1">Location</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative" onClick={() => setActionStep('pick_location')}>
                                            <GlassInput
                                                placeholder="Select Location"
                                                value={inviteData.location}
                                                readOnly
                                                className="!py-2 !text-xs bg-white/5 border-white/10 text-white cursor-pointer hover:bg-white/10"
                                            />
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <ChevronRight size={14} className="text-white/30" />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setActionStep('pick_location')}
                                            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neon-blue hover:bg-white/10 transition-colors"
                                        >
                                            <MapPin size={18} />
                                        </button>
                                    </div>
                                </div>

                                <GlassButton onClick={submitInvite} className="w-full mt-2 h-12 text-sm shadow-lg shadow-neon-blue/20 bg-neon-blue text-black border-0">
                                    Send Invite
                                </GlassButton>
                            </div>
                        )}
                    </div>

                    {/* Arrow pointer */}
                    <div className="absolute -bottom-2 left-[42px] w-4 h-4 bg-[#1e1e24]/95 border-b border-r border-white/10 transform rotate-45"></div>
                </div>
            )}

            {/* 5. INPUT AREA - Fixed Bottom */}
            <div className={`
            flex-none p-4 pt-2 pb-safe-bottom z-30 backdrop-blur-xl border-t transition-all duration-300
            ${isLight ? 'bg-white/80 border-slate-200' : 'bg-black/80 border-white/10'}
        `}>
                <div className="flex items-end gap-2">
                    {!partner?.isTrainer && (
                        <button
                            onClick={() => { hapticFeedback.medium(); setShowActions(!showActions); }}
                            className={`
                            w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border
                            ${showActions
                                    ? 'bg-white text-black rotate-45 border-white'
                                    : (isLight ? 'bg-slate-900 text-white border-slate-900' : 'bg-[#27272a] text-white border-white/10')}
                        `}
                        >
                            <Plus size={22} strokeWidth={2.5} />
                        </button>
                    )}

                    <div className={`flex-1 min-h-[48px] rounded-[24px] border flex items-center px-4 py-2 transition-all ${isLight ? 'bg-slate-100 border-slate-200 focus-within:bg-white focus-within:border-slate-300' : 'bg-white/5 border-white/10 focus-within:bg-black/40 focus-within:border-neon-blue/50'}`}>
                        <textarea
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder={visionImage ? "Ask AI about image..." : "Type a message..."}
                            className={`w-full bg-transparent border-none outline-none text-sm resize-none max-h-24 py-1 ${isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-white/30'}`}
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage('text');
                                }
                            }}
                        />
                    </div>

                    <button
                        onClick={() => handleSendMessage('text')}
                        disabled={!inputMessage && !visionImage}
                        className={`
                        w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg
                        ${(!inputMessage && !visionImage)
                                ? (isLight ? 'bg-slate-100 text-slate-300' : 'bg-white/5 text-white/20')
                                : 'bg-neon-blue text-black hover:scale-105 active:scale-95 shadow-neon-blue/20'}
                    `}
                    >
                        <Send size={20} className={(!inputMessage && !visionImage) ? '' : 'translate-x-0.5 translate-y-0.5'} />
                    </button>
                </div>
            </div>

            {/* REPORT MODAL */}
            {isReportModalOpen && user && partner && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    reportedUserId={userId || ''}
                    reportedUserName={partner.name || 'User'}
                    reporterId={user.id}
                />
            )}
        </div>
    );
};
