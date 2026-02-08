"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Link from "next/link";
import { useMediaQuery } from "usehooks-ts";

import { userSignUpData } from "@/redux/reducer/authSlice";
import { itemQuestionsApi, itemStatisticsApi } from "@/utils/api";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  IoHelpCircleOutline,
  IoChatbubbleOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoPersonOutline,
  IoChevronForward,
  IoFilterOutline,
  IoRefreshOutline,
  IoSendOutline,
  IoCloseOutline,
  IoImageOutline,
  IoStorefrontOutline,
  IoAlertCircleOutline,
} from "react-icons/io5";
import { MdVerified } from "react-icons/md";
import { Loader2, MessageSquare, Package, ExternalLink } from "lucide-react";

import LmxAvatarSvg from "@/components/Avatars/LmxAvatarSvg";

// ============================================
// HELPERS
// ============================================
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Upravo sada";
  if (diffMins < 60) return `Prije ${diffMins} min`;
  if (diffHours < 24) return `Prije ${diffHours}h`;
  if (diffDays < 7) return `Prije ${diffDays} dana`;

  return date.toLocaleDateString("bs-BA", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
};

// ============================================
// USER AVATAR COMPONENT
// ============================================
const UserAvatar = ({
  customAvatarUrl,
  avatarId,
  size = 36,
  className = "",
  showVerified,
  verifiedSize = 10,
}) => {
  const [imgErr, setImgErr] = useState(false);
  const showImg = Boolean(customAvatarUrl) && !imgErr;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className={cn(
          "w-full h-full rounded-full overflow-hidden relative bg-gray-100 shadow-sm border-2 border-slate-200",
          className
        )}
      >
        {showImg ? (
          <img
            src={customAvatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full bg-white flex items-center justify-center text-primary">
            <LmxAvatarSvg avatarId={avatarId || "lmx-01"} className="w-2/3 h-2/3" />
          </div>
        )}
      </div>

      {showVerified && (
        <div
          className="absolute -bottom-0.5 -right-0.5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white"
          style={{
            width: Math.max(14, Math.round(size * 0.33)),
            height: Math.max(14, Math.round(size * 0.33)),
          }}
        >
          <MdVerified className="text-white" size={verifiedSize} />
        </div>
      )}
    </div>
  );
};

// ============================================
// STATS CARD
// ============================================
const StatsCard = ({ icon: Icon, value, label, color = "primary", onClick, isActive }) => {
  const colors = {
    primary: "text-primary bg-primary/10 border-primary/20",
    amber: "text-amber-600 bg-amber-50 border-amber-200",
    green: "text-green-600 bg-green-50 border-green-200",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
        isActive ? colors[color] : "bg-slate-50 border-slate-200 hover:border-slate-300"
      )}
    >
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors[color])}>
        <Icon size={20} />
      </div>
      <span className="text-2xl font-bold text-slate-900">{value}</span>
      <span className="text-xs text-slate-500 font-medium">{label}</span>
    </button>
  );
};

// ============================================
// QUESTION CARD COMPONENT
// ============================================
const QuestionCard = ({ question, onAnswer, isAnswering, currentAnsweringId }) => {
  const [showAnswerForm, setShowAnswerForm] = useState(false);
  const [answer, setAnswer] = useState("");
  const isUnanswered = !question.answer;
  const isCurrentlyAnswering = currentAnsweringId === question.id;

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || answer.length < 5) {
      toast.error("Odgovor mora imati minimalno 5 karaktera");
      return;
    }
    await onAnswer(question.id, answer);
    setShowAnswerForm(false);
    setAnswer("");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-200",
        isUnanswered ? "border-amber-200 bg-amber-50/30" : "border-slate-200"
      )}
    >
      {/* Header - Oglas info */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <Link
          href={`/ad-details/${question.item?.slug || question.item?.id}`}
          className="flex items-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
            {question.item?.image ? (
              <img
                src={question.item.image}
                alt={question.item?.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <IoImageOutline className="text-slate-400" size={20} />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate group-hover:text-primary transition-colors">
              {question.item?.name || "Oglas"}
            </p>
            <p className="text-xs text-slate-500">
              {question.item?.price ? `${question.item.price} KM` : ""}
              {question.item?.status && (
                <span
                  className={cn(
                    "ml-2 px-1.5 py-0.5 rounded text-[10px] font-medium",
                    question.item.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-600"
                  )}
                >
                  {question.item.status === "approved" ? "Aktivan" : question.item.status}
                </span>
              )}
            </p>
          </div>
          <ExternalLink
            size={16}
            className="text-slate-400 group-hover:text-primary transition-colors"
          />
        </Link>
      </div>

      {/* Question content */}
      <div className="p-4">
        {/* Status badge */}
        {isUnanswered && (
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              <IoAlertCircleOutline size={14} />
              Čeka odgovor
            </span>
          </div>
        )}

        {/* Asker info */}
        <div className="flex items-start gap-3">
        <UserAvatar
  customAvatarUrl={question.user?.profile}
  avatarId="lmx-01"
  size={40}
  showVerified={
    question.user?.is_verified === true ||
    question.user?.verified === true ||
    Number(question.user?.is_verified) === 1 ||
    Number(question.user?.verified) === 1
  }
  verifiedSize={10}
/>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-900">
                {question.user?.name || "Korisnik"}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-400">{formatDate(question.created_at)}</span>
            </div>
            <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{question.question}</p>
          </div>
        </div>

        {/* Answer section */}
        {question.answer ? (
          <div className="mt-4 pl-4 border-l-2 border-green-300 bg-green-50/50 rounded-r-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <IoCheckmarkCircleOutline className="text-green-600" size={16} />
              <span className="text-xs font-semibold text-green-700">Vaš odgovor</span>
              <span className="text-xs text-slate-400">· {formatDate(question.answered_at)}</span>
            </div>
            <p className="text-sm text-slate-700">{question.answer}</p>
          </div>
        ) : showAnswerForm ? (
          <div className="mt-4 space-y-3">
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Napišite vaš odgovor..."
              className="min-h-[100px] resize-none"
              disabled={isCurrentlyAnswering}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{answer.length}/1000 karaktera</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAnswerForm(false);
                    setAnswer("");
                  }}
                  disabled={isCurrentlyAnswering}
                >
                  Odustani
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitAnswer}
                  disabled={isCurrentlyAnswering || answer.length < 5}
                  className="gap-1.5"
                >
                  {isCurrentlyAnswering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Šaljem...
                    </>
                  ) : (
                    <>
                      <IoSendOutline size={16} />
                      Pošalji odgovor
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnswerForm(true)}
              className="gap-1.5 text-primary border-primary/30 hover:bg-primary/5"
            >
              <IoChatbubbleOutline size={16} />
              Odgovori
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ============================================
// EMPTY STATE
// ============================================
const EmptyState = ({ filter }) => {
  const messages = {
    all: {
      title: "Nemate pitanja",
      description: "Kada neko postavi pitanje na vaše oglase, pojavit će se ovdje.",
      icon: IoHelpCircleOutline,
    },
    unanswered: {
      title: "Sva pitanja su odgovorena",
      description: "Odlično! Nemate neodgovorenih pitanja.",
      icon: IoCheckmarkCircleOutline,
    },
    answered: {
      title: "Još nemate odgovorenih pitanja",
      description: "Pitanja na koja odgovorite pojavit će se ovdje.",
      icon: IoChatbubbleOutline,
    },
  };

  const msg = messages[filter] || messages.all;
  const Icon = msg.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="text-slate-400" size={32} />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{msg.title}</h3>
      <p className="text-sm text-slate-500 max-w-sm">{msg.description}</p>
    </div>
  );
};

// ============================================
// LOADING SKELETON
// ============================================
const QuestionSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-slate-200" />
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-slate-200 rounded w-1/4" />
        </div>
      </div>
    </div>
    <div className="p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-200" />
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
          <div className="h-3 bg-slate-200 rounded w-full mb-2" />
          <div className="h-3 bg-slate-200 rounded w-2/3" />
        </div>
      </div>
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================
const PublicQuestionsPage = () => {
  const userData = useSelector(userSignUpData);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    unanswered: 0,
    answered: 0,
  });
  const [answeringId, setAnsweringId] = useState(null);

  // Fetch questions
  const fetchQuestions = useCallback(
    async (pageNum = 1, refresh = false) => {
      if (!userData?.id) return;

      try {
        if (refresh) setIsRefreshing(true);
        else if (pageNum === 1) setIsLoading(true);

        const response = await itemQuestionsApi.getSellerQuestions({
          page: pageNum,
          status: filter === "all" ? undefined : filter,
        });

        if (response?.data?.error === false) {
          const data = response.data.data?.data || response.data.data || [];
          const pagination = response.data.data;

          if (pageNum === 1 || refresh) {
            setQuestions(data);
          } else {
            setQuestions((prev) => [...prev, ...data]);
          }

          setStats({
            total: (response.data.unanswered_count || 0) + (response.data.answered_count || 0),
            unanswered: response.data.unanswered_count || 0,
            answered: response.data.answered_count || 0,
          });

          setHasMore(pagination?.current_page < pagination?.last_page);
          setPage(pageNum);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        toast.error("Greška pri učitavanju pitanja");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [userData?.id, filter]
  );

  // Initial fetch
  useEffect(() => {
    fetchQuestions(1);
  }, [fetchQuestions]);

  // Handle answer submission
  const handleAnswer = async (questionId, answerText) => {
    if (!answerText.trim()) return;

    setAnsweringId(questionId);

    try {
      const currentQuestion = questions.find((q) => q.id === questionId);
      const response = await itemQuestionsApi.answerQuestion({
        question_id: questionId,
        answer: answerText,
      });

      if (response?.data?.error === false) {
        toast.success("Odgovor je uspješno poslat!");
        // Update local state
        setQuestions((prev) =>
          prev.map((q) =>
            q.id === questionId
              ? { ...q, answer: answerText, answered_at: new Date().toISOString() }
              : q
          )
        );
        // Update stats
        setStats((prev) => ({
          ...prev,
          unanswered: Math.max(0, prev.unanswered - 1),
          answered: prev.answered + 1,
        }));
        if (currentQuestion?.item_id || currentQuestion?.item?.id) {
          await itemStatisticsApi.trackEngagement({
            item_id: currentQuestion?.item_id || currentQuestion?.item?.id,
            engagement_type: "public_question",
            extra_data: [{ action: "answer", question_id: questionId }],
          });
        }
      } else {
        toast.error(response?.data?.message || "Greška pri slanju odgovora");
      }
    } catch (error) {
      console.error("Error answering question:", error);
      toast.error("Greška pri slanju odgovora");
    } finally {
      setAnsweringId(null);
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchQuestions(page + 1);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchQuestions(1, true);
  };

  // Filter content for mobile sheet
  const FilterContent = (
    <div className="space-y-2">
      <button
        onClick={() => setFilter("all")}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
          filter === "all" ? "bg-primary/10 text-primary" : "hover:bg-slate-50"
        )}
      >
        <IoHelpCircleOutline size={20} />
        <span className="flex-1 text-left font-medium">Sva pitanja</span>
        <span className="text-sm text-slate-500">{stats.total}</span>
      </button>
      <button
        onClick={() => setFilter("unanswered")}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
          filter === "unanswered" ? "bg-amber-100 text-amber-700" : "hover:bg-slate-50"
        )}
      >
        <IoTimeOutline size={20} />
        <span className="flex-1 text-left font-medium">Čekaju odgovor</span>
        <span className="text-sm">{stats.unanswered}</span>
      </button>
      <button
        onClick={() => setFilter("answered")}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
          filter === "answered" ? "bg-green-100 text-green-700" : "hover:bg-slate-50"
        )}
      >
        <IoCheckmarkCircleOutline size={20} />
        <span className="flex-1 text-left font-medium">Odgovorena</span>
        <span className="text-sm">{stats.answered}</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Javna pitanja</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upravljajte pitanjima sa vaših oglasa
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <IoRefreshOutline
              size={16}
              className={cn(isRefreshing && "animate-spin")}
            />
            <span className="hidden sm:inline">Osvježi</span>
          </Button>

          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <IoFilterOutline size={16} />
                  Filtriraj
                  {filter !== "all" && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl">
                <SheetHeader className="mb-4">
                  <SheetTitle>Filtriraj pitanja</SheetTitle>
                </SheetHeader>
                {FilterContent}
              </SheetContent>
            </Sheet>
          ) : (
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtriraj" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sva pitanja ({stats.total})</SelectItem>
                <SelectItem value="unanswered">
                  Čekaju odgovor ({stats.unanswered})
                </SelectItem>
                <SelectItem value="answered">
                  Odgovorena ({stats.answered})
                </SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatsCard
          icon={IoHelpCircleOutline}
          value={stats.total}
          label="Ukupno"
          color="primary"
          onClick={() => setFilter("all")}
          isActive={filter === "all"}
        />
        <StatsCard
          icon={IoTimeOutline}
          value={stats.unanswered}
          label="Čeka odgovor"
          color="amber"
          onClick={() => setFilter("unanswered")}
          isActive={filter === "unanswered"}
        />
        <StatsCard
          icon={IoCheckmarkCircleOutline}
          value={stats.answered}
          label="Odgovoreno"
          color="green"
          onClick={() => setFilter("answered")}
          isActive={filter === "answered"}
        />
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <QuestionSkeleton />
            <QuestionSkeleton />
            <QuestionSkeleton />
          </>
        ) : questions.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          <AnimatePresence mode="popLayout">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onAnswer={handleAnswer}
                isAnswering={answeringId !== null}
                currentAnsweringId={answeringId}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Load More */}
      {hasMore && questions.length > 0 && !isLoading && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="gap-2"
          >
            Učitaj više
            <IoChevronForward size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default PublicQuestionsPage;