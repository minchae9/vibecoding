'use client';

import { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Calendar, MessageCircle, Upload, Activity, Utensils, Heart,
  ChevronLeft, ChevronRight, Send, Bot, User, Sparkles
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function Home() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({ sessions: [], events: [], scores: [] });
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [healthScore, setHealthScore] = useState(null);
  const [healthProfile, setHealthProfile] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  // 오늘 날짜인지 확인
  const isToday = isSameDay(selectedDate, new Date());

  // 캘린더 데이터 로드
  useEffect(() => {
    const year = format(currentMonth, 'yyyy');
    const month = format(currentMonth, 'MM');
    fetch(`${API_URL}/api/health/calendar/${year}/${month}`)
      .then(res => res.json())
      .then(data => setCalendarData(data))
      .catch(console.error);
  }, [currentMonth]);

  // 선택된 날짜의 타임라인 로드
  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    fetch(`${API_URL}/api/health/timeline/${dateStr}`)
      .then(res => res.json())
      .then(data => setTimelineEvents(data.events || []))
      .catch(console.error);
  }, [selectedDate]);

  // 오늘의 세션 로드
  useEffect(() => {
    if (isToday) {
      fetch(`${API_URL}/api/chat/session`)
        .then(res => res.json())
        .then(data => {
          if (data.messages) {
            setMessages(data.messages);
          }
        })
        .catch(console.error);
    }
  }, [isToday]);

  // 건강 프로필 로드
  useEffect(() => {
    fetch(`${API_URL}/api/health/profile`)
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setHealthProfile(data.profile);
        }
      })
      .catch(console.error);
  }, []);

  // 건강 점수 로드
  useEffect(() => {
    fetch(`${API_URL}/api/health/score`)
      .then(res => res.json())
      .then(data => setHealthScore(data))
      .catch(console.error);
  }, [messages]);

  // 채팅 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 전송
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    // 사용자 메시지 즉시 표시
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const res = await fetch(`${API_URL}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);

      // 타임라인 새로고침
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const tlRes = await fetch(`${API_URL}/api/health/timeline/${dateStr}`);
      const tlData = await tlRes.json();
      setTimelineEvents(tlData.events || []);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.'
      }]);
    }

    setIsLoading(false);
  };

  // PDF 업로드
  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const res = await fetch(`${API_URL}/api/health/upload-pdf', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setHealthProfile(data.profile);
        alert('건강검진 결과가 성공적으로 등록되었습니다!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('업로드에 실패했습니다.');
    }
  };

  // 캘린더 날짜 생성
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 이벤트 아이콘
  const getEventIcon = (type) => {
    switch (type) {
      case 'meal': return <Utensils className="w-4 h-4" />;
      case 'activity': return <Activity className="w-4 h-4" />;
      case 'status': return <Heart className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  // 건강 점수 색상
  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-lime-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 왼쪽: 캘린더 + 타임라인 */}
        <div className="lg:col-span-2 space-y-6">

          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Heart className="w-8 h-8 text-rose-500" />
                Health Buddy
              </h1>
              <p className="text-gray-500 mt-1">AI 기반 건강 의사결정 지원</p>
            </div>

            {/* PDF 업로드 */}
            <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition">
              <Upload className="w-4 h-4" />
              <span>검진결과 업로드</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* 캘린더 */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold">
                {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
              </h2>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* 요일 헤더 */}
              {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
                <div key={day} className={`text-center text-sm font-medium py-2 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
                  {day}
                </div>
              ))}

              {/* 날짜 */}
              {days.map((day, i) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const sessionData = calendarData.sessions?.find(s => s.session_date === dateStr);
                const dayScore = calendarData.scores?.find(s => s.date === dateStr);
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isSameDay(day, new Date());

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(day)}
                    className={`calendar-day aspect-square flex flex-col items-center justify-center rounded-xl relative ${
                      isSelected ? 'bg-blue-500 text-white' :
                      isTodayDate ? 'bg-blue-100 text-blue-700' :
                      'hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm font-medium">{format(day, 'd')}</span>
                    {sessionData && (
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-0.5" />
                    )}
                    {dayScore && (
                      <div className={`absolute bottom-1 w-8 h-1 rounded-full ${getScoreColor(dayScore.health_score)}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 타임라인 */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              {format(selectedDate, 'M월 d일 (E)', { locale: ko })} 타임라인
            </h3>

            {timelineEvents.length === 0 ? (
              <p className="text-gray-400 text-center py-8">기록된 활동이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {timelineEvents.map((event, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`p-2 rounded-lg ${
                      event.event_type === 'meal' ? 'bg-orange-100 text-orange-600' :
                      event.event_type === 'activity' ? 'bg-green-100 text-green-600' :
                      'bg-pink-100 text-pink-600'
                    }`}>
                      {getEventIcon(event.event_type)}
                    </div>
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-gray-500">{event.event_time?.substring(0, 5)}</div>
                      {event.description && (
                        <div className="text-sm text-gray-600 mt-1">{event.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TMI / 일기 영역 */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">📝 오늘의 TMI</h3>
            <div className="prose prose-sm max-w-none text-gray-600">
              {messages.length > 0 ? (
                <div className="space-y-2">
                  {messages.slice(-5).map((msg, i) => (
                    msg.role === 'user' && (
                      <p key={i} className="text-gray-700">{msg.content}</p>
                    )
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">대화를 시작하면 여기에 요약이 표시됩니다</p>
              )}
            </div>
          </div>

          {/* Health Suitability Scale */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Health Suitability Scale</h3>
            <div className="relative">
              <div className="health-gradient-bar h-4 rounded-full" />
              <div
                className="absolute top-0 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow-lg transform -translate-x-1/2 transition-all duration-500"
                style={{ left: `${(healthScore?.score || 50)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>주의 필요</span>
              <span>보통</span>
              <span>매우 좋음</span>
            </div>
            {healthScore?.comment && (
              <p className="mt-4 text-center text-gray-600">{healthScore.comment}</p>
            )}
          </div>
        </div>

        {/* 오른쪽: 채팅 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm h-[calc(100vh-2rem)] flex flex-col sticky top-4">
            {/* 채팅 헤더 */}
            <div className="p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">Health Buddy</h3>
                  <p className="text-xs text-gray-500">항상 여기서 대화할 수 있어요</p>
                </div>
              </div>
            </div>

            {/* 메시지 영역 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>안녕하세요! 무엇을 도와드릴까요?</p>
                  <p className="text-sm mt-2">식사, 운동, 기분 등을 자유롭게 이야기해주세요</p>
                </div>
              )}

              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`chat-message flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === 'user' ? 'bg-blue-500' : 'bg-gray-200'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-gray-600" />
                    )}
                  </div>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-800 rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 p-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="메시지를 입력하세요..."
                  className="flex-1 px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!isToday}
                />
                <button
                  onClick={sendMessage}
                  disabled={isLoading || !isToday}
                  className="p-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              {!isToday && (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  오늘 날짜만 채팅할 수 있습니다
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
