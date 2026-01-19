"use client";
import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import {
  MdQuestionAnswer,
  MdSend,
  MdExpandMore,
  MdExpandLess,
  MdPerson,
  MdVerified,
  MdStorefront,
  MdThumbUp,
  MdThumbUpOffAlt,
  MdMoreVert,
  MdFlag,
  MdDelete,
  MdEdit,
  MdClose,
  MdCheck
} from "react-icons/md";
import { userSignUpData, getIsLoggedIn } from "@/redux/reducer/authSlice";
import { setIsLoginOpen } from "@/redux/reducer/globalStateSlice";
import { itemQuestionsApi } from "@/utils/api";
import CustomImage from "@/components/Common/CustomImage";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { bs } from "date-fns/locale";

// Formatiranje vremena
const formatTimeAgo = (dateString) => {
  if (!dateString) return "";
  try {
    return formatDistanceToNow(new Date(dateString), {
      addSuffix: true,
      locale: bs
    });
  } catch {
    return "";
  }
};

// Pojedinačno pitanje komponenta
const QuestionItem = ({
  question,
  isSeller,
  currentUserId,
  onAnswer,
  onLike,
  onDelete,
  onReport
}) => {
  const [showAnswer, setShowAnswer] = useState(!!question.answer);
  const [isAnswering, setIsAnswering] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isMyQuestion = question.user_id === currentUserId;
  const hasAnswer = !!question.answer;
  const isLiked = question.is_liked;

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      toast.error("Unesite odgovor");
      return;
    }
    setIsSubmitting(true);
    try {
      await onAnswer(question.id, answerText);
      setIsAnswering(false);
      setAnswerText("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-slate-200 transition-colors">
      {/* Pitanje */}
      <div className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
              <CustomImage
                src={question.user?.profile}
                alt={question.user?.name || "Korisnik"}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Sadržaj */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 text-sm">
                {question.user?.name || "Korisnik"}
              </span>
              {question.user?.is_verified === 1 && (
                <MdVerified className="text-blue-500 text-sm" />
              )}
              <span className="text-xs text-slate-400">
                {formatTimeAgo(question.created_at)}
              </span>
              {isMyQuestion && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                  Tvoje pitanje
                </span>
              )}
            </div>

            <p className="mt-1.5 text-slate-700 text-sm leading-relaxed">
              {question.question}
            </p>

            {/* Akcije */}
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={() => onLike(question.id)}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium transition-colors",
                  isLiked
                    ? "text-blue-600"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                {isLiked ? (
                  <MdThumbUp className="text-base" />
                ) : (
                  <MdThumbUpOffAlt className="text-base" />
                )}
                <span>{question.likes_count || 0}</span>
              </button>

              {hasAnswer && (
                <button
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showAnswer ? <MdExpandLess /> : <MdExpandMore />}
                  <span>{showAnswer ? "Sakrij odgovor" : "Prikaži odgovor"}</span>
                </button>
              )}

              {isSeller && !hasAnswer && (
                <button
                  onClick={() => setIsAnswering(!isAnswering)}
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <MdQuestionAnswer className="text-base" />
                  <span>Odgovori</span>
                </button>
              )}

              {/* Dropdown menu */}
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <MdMoreVert />
                </button>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-20 min-w-[140px]">
                      {isMyQuestion && (
                        <button
                          onClick={() => {
                            onDelete(question.id);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <MdDelete />
                          <span>Obriši</span>
                        </button>
                      )}
                      {!isMyQuestion && (
                        <button
                          onClick={() => {
                            onReport(question.id);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          <MdFlag />
                          <span>Prijavi</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Forma za odgovor */}
        {isAnswering && (
          <div className="mt-4 pl-13">
            <div className="bg-slate-50 rounded-xl p-3">
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Napišite odgovor..."
                rows={3}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => setIsAnswering(false)}
                  className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Odustani
                </button>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={isSubmitting || !answerText.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <MdSend className="text-base" />
                  )}
                  <span>Pošalji</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Odgovor prodavača */}
      {hasAnswer && showAnswer && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100 p-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-green-100 border-2 border-green-200 flex items-center justify-center">
                <MdStorefront className="text-green-600 text-xl" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-green-800 text-sm">
                  Odgovor prodavača
                </span>
                <MdVerified className="text-green-600 text-sm" />
                <span className="text-xs text-green-600/70">
                  {formatTimeAgo(question.answered_at)}
                </span>
              </div>
              <p className="mt-1.5 text-green-800/90 text-sm leading-relaxed">
                {question.answer}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Glavna komponenta
const ProductQuestions = ({ productDetails, isSeller = false }) => {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector(getIsLoggedIn);
  const currentUser = useSelector(userSignUpData);
  const currentUserId = currentUser?.id;

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

  // Dohvati pitanja
  const fetchQuestions = useCallback(async (pageNum = 1, append = false) => {
    if (!itemId) return;

    try {
      setIsLoading(true);
      const response = await itemQuestionsApi.getQuestions({
        item_id: itemId,
        page: pageNum
      });

      if (response?.data?.error === false) {
        const data = response.data.data;
        if (append) {
          setQuestions(prev => [...prev, ...data.data]);
        } else {
          setQuestions(data.data || []);
        }
        setHasMore(data.current_page < data.last_page);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error("Greška pri dohvaćanju pitanja:", error);
    } finally {
      setIsLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Postavi pitanje
  const handleAskQuestion = async () => {
    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      return;
    }

    if (!newQuestion.trim()) {
      toast.error("Unesite pitanje");
      return;
    }

    if (newQuestion.trim().length < 10) {
      toast.error("Pitanje mora imati najmanje 10 karaktera");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await itemQuestionsApi.addQuestion({
        item_id: itemId,
        question: newQuestion.trim()
      });

      if (response?.data?.error === false) {
        toast.success("Pitanje je uspješno postavljeno!");
        setNewQuestion("");
        setShowAskForm(false);
        fetchQuestions(); // Refresh
      } else {
        toast.error(response?.data?.message || "Greška pri postavljanju pitanja");
      }
    } catch (error) {
      toast.error("Greška pri postavljanju pitanja");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Odgovori na pitanje (samo seller)
  const handleAnswer = async (questionId, answer) => {
    try {
      const response = await itemQuestionsApi.answerQuestion({
        question_id: questionId,
        answer: answer.trim()
      });

      if (response?.data?.error === false) {
        toast.success("Odgovor je uspješno poslat!");
        fetchQuestions(); // Refresh
      } else {
        toast.error(response?.data?.message || "Greška pri slanju odgovora");
      }
    } catch (error) {
      toast.error("Greška pri slanju odgovora");
      console.error(error);
    }
  };

  // Lajkuj pitanje
  const handleLike = async (questionId) => {
    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      return;
    }

    try {
      await itemQuestionsApi.likeQuestion({ question_id: questionId });
      // Optimistički update
      setQuestions(prev => prev.map(q =>
        q.id === questionId
          ? {
              ...q,
              is_liked: !q.is_liked,
              likes_count: q.is_liked ? (q.likes_count - 1) : (q.likes_count + 1)
            }
          : q
      ));
    } catch (error) {
      console.error(error);
    }
  };

  // Obriši pitanje
  const handleDelete = async (questionId) => {
    if (!confirm("Jeste li sigurni da želite obrisati ovo pitanje?")) return;

    try {
      const response = await itemQuestionsApi.deleteQuestion({
        question_id: questionId
      });

      if (response?.data?.error === false) {
        toast.success("Pitanje je obrisano");
        setQuestions(prev => prev.filter(q => q.id !== questionId));
        setTotalCount(prev => prev - 1);
      }
    } catch (error) {
      toast.error("Greška pri brisanju pitanja");
      console.error(error);
    }
  };

  // Prijavi pitanje
  const handleReport = async (questionId) => {
    if (!isLoggedIn) {
      dispatch(setIsLoginOpen(true));
      return;
    }

    try {
      await itemQuestionsApi.reportQuestion({ question_id: questionId });
      toast.success("Pitanje je prijavljeno");
    } catch (error) {
      toast.error("Greška pri prijavljivanju pitanja");
      console.error(error);
    }
  };

  // Učitaj više
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchQuestions(nextPage, true);
  };

  const displayedQuestions = isExpanded ? questions : questions.slice(0, 3);
  const hasQuestions = questions.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Zaglavlje */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 px-5 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl shadow-sm">
              <MdQuestionAnswer className="text-primary text-xl" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Javna pitanja</h3>
              <p className="text-xs text-slate-500">
                {totalCount > 0
                  ? `${totalCount} ${totalCount === 1 ? 'pitanje' : totalCount < 5 ? 'pitanja' : 'pitanja'}`
                  : 'Postavite prvo pitanje'
                }
              </p>
            </div>
          </div>

          {!showAskForm && (
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  dispatch(setIsLoginOpen(true));
                  return;
                }
                setShowAskForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm"
            >
              <MdQuestionAnswer />
              <span>Postavi pitanje</span>
            </button>
          )}
        </div>
      </div>

      {/* Forma za novo pitanje */}
      {showAskForm && (
        <div className="p-5 border-b border-slate-100 bg-blue-50/30">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                <CustomImage
                  src={currentUser?.profile}
                  alt={currentUser?.name || "Vi"}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="flex-1">
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Napišite vaše pitanje o ovom proizvodu..."
                rows={3}
                maxLength={500}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-slate-400">
                  {newQuestion.length}/500 karaktera
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setShowAskForm(false);
                      setNewQuestion("");
                    }}
                    className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Odustani
                  </button>
                  <button
                    onClick={handleAskQuestion}
                    disabled={isSubmitting || newQuestion.trim().length < 10}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <MdSend />
                    )}
                    <span>Pošalji pitanje</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista pitanja */}
      <div className="p-5">
        {isLoading && questions.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : hasQuestions ? (
          <div className="space-y-4">
            {displayedQuestions.map((question) => (
              <QuestionItem
                key={question.id}
                question={question}
                isSeller={isSeller}
                currentUserId={currentUserId}
                onAnswer={handleAnswer}
                onLike={handleLike}
                onDelete={handleDelete}
                onReport={handleReport}
              />
            ))}

            {/* Prikaži više / Sakrij */}
            {questions.length > 3 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                {isExpanded ? (
                  <>
                    <MdExpandLess className="text-lg" />
                    <span>Prikaži manje</span>
                  </>
                ) : (
                  <>
                    <MdExpandMore className="text-lg" />
                    <span>Prikaži još {questions.length - 3} pitanja</span>
                  </>
                )}
              </button>
            )}

            {/* Učitaj više sa servera */}
            {hasMore && isExpanded && (
              <button
                onClick={handleLoadMore}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-sm font-medium text-slate-600 transition-colors"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                ) : (
                  "Učitaj još pitanja"
                )}
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <MdQuestionAnswer className="text-3xl text-slate-400" />
            </div>
            <h4 className="font-semibold text-slate-700 mb-1">Nema pitanja</h4>
            <p className="text-sm text-slate-500 mb-4">
              Budite prvi koji će postaviti pitanje o ovom proizvodu
            </p>
            {!showAskForm && (
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    dispatch(setIsLoginOpen(true));
                    return;
                  }
                  setShowAskForm(true);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                <MdQuestionAnswer />
                <span>Postavi prvo pitanje</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductQuestions;
