"use client";
import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import {
  MdQuestionAnswer,
  MdSend,
  MdExpandMore,
  MdExpandLess,
  MdVerified,
  MdStorefront,
  MdThumbUp,
  MdThumbUpOffAlt,
  MdMoreVert,
  MdFlag,
  MdDelete,
  MdCheck
} from "react-icons/md";
import { userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { itemQuestionsApi } from "@/utils/api";
import CustomImage from "@/components/Common/CustomImage";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { bs } from "date-fns/locale";

const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  try { return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: bs }); } catch { return ""; }
};

const QuestionItem = ({ question, isSeller, currentUserId, onAnswer, onLike, onDelete, onReport }) => {
  const [showAnswer, setShowAnswer] = useState(!!question.answer);
  const [isAnswering, setIsAnswering] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isMyQuestion = question.user_id === currentUserId;
  const hasAnswer = !!question.answer;
  const isLiked = question.is_liked;

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) return toast.error("Unesite odgovor");
    setIsSubmitting(true);
    try { await onAnswer(question.id, answerText); setIsAnswering(false); setAnswerText(""); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
      <div className="p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <CustomImage src={question.user?.profile} alt={question.user?.name} width={40} height={40} className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{question.user?.name || "Korisnik"}</span>
              {question.user?.is_verified === 1 && <MdVerified className="text-blue-500 text-sm" />}
              <span className="text-xs text-slate-400 dark:text-slate-500">{formatTimeAgo(question.created_at)}</span>
              {isMyQuestion && <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">Tvoje pitanje</span>}
            </div>
            <p className="mt-1.5 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{question.question}</p>
            <div className="flex items-center gap-3 mt-3">
              <button onClick={() => onLike(question.id)} className={cn("flex items-center gap-1.5 text-xs font-medium transition-colors", isLiked ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300")}>
                {isLiked ? <MdThumbUp className="text-base" /> : <MdThumbUpOffAlt className="text-base" />} <span>{question.likes_count || 0}</span>
              </button>
              {hasAnswer && (
                <button onClick={() => setShowAnswer(!showAnswer)} className="flex items-center gap-1 text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  {showAnswer ? <MdExpandLess /> : <MdExpandMore />} <span>{showAnswer ? "Sakrij odgovor" : "Prikaži odgovor"}</span>
                </button>
              )}
              {isSeller && !hasAnswer && (
                <button onClick={() => setIsAnswering(!isAnswering)} className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                  <MdQuestionAnswer className="text-base" /> <span>Odgovori</span>
                </button>
              )}
              <div className="relative ml-auto">
                <button onClick={() => setShowMenu(!showMenu)} className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><MdMoreVert /></button>
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 py-1 z-20 min-w-[140px]">
                      {isMyQuestion && <button onClick={() => { onDelete(question.id); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><MdDelete /> <span>Obriši</span></button>}
                      {!isMyQuestion && <button onClick={() => { onReport(question.id); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"><MdFlag /> <span>Prijavi</span></button>}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {isAnswering && (
          <div className="mt-4 pl-13">
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl">
              <textarea value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Napišite odgovor..." rows={3} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 dark:text-slate-100" />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button onClick={() => setIsAnswering(false)} className="px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">Odustani</button>
                <button onClick={handleSubmitAnswer} disabled={isSubmitting || !answerText.trim()} className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all">
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <MdSend className="text-base" />} <span>Pošalji</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {hasAnswer && showAnswer && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border-t border-green-100 dark:border-green-900/30 p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-900/50 flex items-center justify-center">
                <MdStorefront className="text-green-600 dark:text-green-400 text-xl" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-800 dark:text-green-300 text-sm">Odgovor prodavača</span>
                <MdVerified className="text-green-600 dark:text-green-400 text-sm" />
                <span className="text-xs text-green-600/70 dark:text-green-400/60">{formatTimeAgo(question.answered_at)}</span>
              </div>
              <p className="mt-1.5 text-green-800/90 dark:text-green-200/90 text-sm leading-relaxed">{question.answer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductQuestions = ({ productDetails, isSeller = false }) => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(getIsLoggedIn);
  const currentUser = useSelector(userSignUpData);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAskForm, setShowAskForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const itemId = productDetails?.id;

  const fetchQuestions = useCallback(async (pageNum = 1, append = false) => {
    if (!itemId) return;
    try {
      setIsLoading(true);
      const response = await itemQuestionsApi.getQuestions({ item_id: itemId, page: pageNum });
      if (!response?.data?.error) {
        const data = response.data.data;
        setQuestions(prev => append ? [...prev, ...data.data] : data.data || []);
        setHasMore(data.current_page < data.last_page);
        setTotalCount(data.total || 0);
      }
    } catch (e) { console.error(e); } finally { setIsLoading(false); }
  }, [itemId]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleAskQuestion = async () => {
    if (!isLoggedIn) return dispatch(setIsLoginOpen(true));
    if (!newQuestion.trim()) return toast.error("Unesite pitanje");
    setIsSubmitting(true);
    try {
      const res = await itemQuestionsApi.addQuestion({ item_id: itemId, question: newQuestion.trim() });
      if (!res?.data?.error) {
        toast.success("Pitanje postavljeno");
        setNewQuestion("");
        setShowAskForm(false);
        fetchQuestions();
      } else toast.error(res?.data?.message);
    } catch { toast.error("Greška"); } finally { setIsSubmitting(false); }
  };

  const handleAnswer = async (qId, ans) => {
    try {
      const res = await itemQuestionsApi.answerQuestion({ question_id: qId, answer: ans.trim() });
      if (!res?.data?.error) { toast.success("Odgovoreno"); fetchQuestions(); }
      else toast.error(res?.data?.message);
    } catch { toast.error("Greška"); }
  };

  const handleLike = async (qId) => {
    if (!isLoggedIn) return dispatch(setIsLoginOpen(true));
    try {
      await itemQuestionsApi.likeQuestion({ question_id: qId });
      setQuestions(prev => prev.map(q => q.id === qId ? { ...q, is_liked: !q.is_liked, likes_count: q.is_liked ? q.likes_count - 1 : q.likes_count + 1 } : q));
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (qId) => {
    if (!confirm("Obrisati pitanje?")) return;
    try {
      const res = await itemQuestionsApi.deleteQuestion({ question_id: qId });
      if (!res?.data?.error) {
        toast.success("Obrisano");
        setQuestions(prev => prev.filter(q => q.id !== qId));
        setTotalCount(prev => prev - 1);
      }
    } catch { toast.error("Greška"); }
  };

  const handleReport = async (qId) => {
    if (!isLoggedIn) return dispatch(setIsLoginOpen(true));
    try { await itemQuestionsApi.reportQuestion({ question_id: qId }); toast.success("Prijavljeno"); } catch { toast.error("Greška"); }
  };

  const displayedQuestions = isExpanded ? questions : questions.slice(0, 3);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 delay-400">
      <div className="bg-slate-50/50 dark:bg-slate-800/50 px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
            <MdQuestionAnswer className="text-primary text-xl" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">Javna pitanja</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{totalCount > 0 ? `${totalCount} pitanja` : 'Postavite prvo pitanje'}</p>
          </div>
        </div>
        {!showAskForm && (
          <button onClick={() => isLoggedIn ? setShowAskForm(true) : dispatch(setIsLoginOpen(true))} className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-all shadow-sm">
            <MdQuestionAnswer /> <span>Postavi pitanje</span>
          </button>
        )}
      </div>

      {showAskForm && (
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-blue-50/30 dark:bg-blue-900/10">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <CustomImage src={currentUser?.profile} alt="Vi" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <textarea value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} placeholder="Napišite vaše pitanje..." rows={3} maxLength={500} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800 dark:text-slate-100" />
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-slate-400 dark:text-slate-500">{newQuestion.length}/500</span>
                <div className="flex gap-2">
                  <button onClick={() => { setShowAskForm(false); setNewQuestion(""); }} className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">Odustani</button>
                  <button onClick={handleAskQuestion} disabled={isSubmitting || newQuestion.trim().length < 10} className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all">
                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <MdSend />} <span>Pošalji</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-5">
        {isLoading && questions.length === 0 ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : questions.length > 0 ? (
          <div className="space-y-4">
            {displayedQuestions.map(q => <QuestionItem key={q.id} question={q} isSeller={isSeller} currentUserId={currentUser?.id} onAnswer={handleAnswer} onLike={handleLike} onDelete={handleDelete} onReport={handleReport} />)}
            {questions.length > 3 && (
              <button onClick={() => setIsExpanded(!isExpanded)} className="w-full py-3 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex justify-center gap-2">
                {isExpanded ? <><MdExpandLess size={18} /> Manje</> : <><MdExpandMore size={18} /> Još {questions.length - 3}</>}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500"><MdQuestionAnswer size={32} /></div>
            <h4 className="font-semibold text-slate-700 dark:text-slate-200">Nema pitanja</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">Budite prvi koji će postaviti pitanje.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductQuestions;