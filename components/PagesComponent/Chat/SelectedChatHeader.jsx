import React, { useState } from "react";
import { 
  HiOutlineDotsVertical, 
  HiPhone, 
  HiEye, 
  HiOutlineSearch, 
  HiOutlinePhotograph, 
  HiOutlineArchive, 
  HiOutlineTrash, 
  HiOutlineVolumeOff,
  HiOutlineVolumeUp,
  HiOutlineInboxIn, // ✅ NOVA IKONICA ZA UNARCHIVE
  HiX 
} from "@/components/Common/UnifiedIconPack";
import { MdArrowBack, MdVerified, MdStar } from "@/components/Common/UnifiedIconPack";
import { formatPriceAbbreviated, t } from "@/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomLink from "@/components/Common/CustomLink";
import { blockUserApi, unBlockUserApi, chatListApi } from "@/utils/api";
import { toast } from "@/utils/toastBs";
import { useSelector } from "react-redux";
import { getIsRtl } from "@/redux/reducer/languageSlice";
import CustomImage from "@/components/Common/CustomImage";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const formatLastSeen = (timestamp) => {
  if (!timestamp) return "";
  const now = new Date();
  const lastSeen = new Date(timestamp);
  if (isNaN(lastSeen.getTime())) return "";

  const diffInSeconds = Math.floor((now - lastSeen) / 1000);
  if (diffInSeconds < 60) return "Upravo sada";
  if (diffInSeconds < 3600) return `Prije ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Prije ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 172800) return "Jučer";
  
  return lastSeen.toLocaleDateString("bs-BA", {
    day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit'
  });
};

const getItemStatusBadge = (status) => {
    switch (status) {
        case 'sold':
            return <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-bold border border-red-200">PRODANO</span>;
        case 'reserved':
            return <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-bold border border-orange-200">REZERVIRANO</span>;
        case 'active':
        default:
            return <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-600 font-bold border border-green-200">NA PRODAJU</span>;
    }
};

const SelectedChatHeader = ({
  selectedChat,
  isSelling,
  setSelectedChat,
  handleBack,
  isLargeScreen,
  onSearch, 
  onDelete, 
  onArchive,
  onUnarchive, // ✅ NOVI PROP KOJI MORAŠ PROSLIJEDITI IZ CHAT.JSX
  onShowMedia 
}) => {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isBlocked = selectedChat?.user_blocked;
  const isMuted = selectedChat?.is_muted || false;
  // ✅ Provjera da li je chat arhiviran
  const isArchived = selectedChat?.is_archived || false; 

  const userData = isSelling ? selectedChat?.buyer : selectedChat?.seller;
  const itemData = selectedChat?.item;
  const isRTL = useSelector(getIsRtl);

  const isOnline = userData?.is_online || false;
  const lastSeenText = !isOnline && userData?.last_seen ? formatLastSeen(userData.last_seen) : null;
  const isVerified = userData?.email_verified_at ? true : false; 
  const rating = userData?.rating || null;

  const handleToggleMute = async () => {
    try {
        if (isMuted) {
            const res = await chatListApi.unmuteChat(selectedChat.id);
            if (!res?.data?.error) {
                toast.success("Notifikacije uključene");
                setSelectedChat(prev => ({ ...prev, is_muted: false }));
            }
        } else {
            const res = await chatListApi.muteChat(selectedChat.id);
            if (!res?.data?.error) {
                toast.success("Notifikacije isključene");
                setSelectedChat(prev => ({ ...prev, is_muted: true }));
            }
        }
    } catch (error) {
        console.error(error);
        toast.error("Greška pri promjeni postavki zvuka");
    }
  };

  const handleBlockUser = async () => {
    try {
      const response = await blockUserApi.blockUser({ blocked_user_id: userData?.id });
      if (response?.data?.error === false) {
        setSelectedChat((prev) => ({ ...prev, user_blocked: true }));
        toast.success(response?.data?.message);
      } else {
        toast.error(response?.data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleUnBlockUser = async () => {
    try {
      const response = await unBlockUserApi.unBlockUser({ blocked_user_id: userData?.id });
      if (response?.data.error === false) {
        setSelectedChat((prev) => ({ ...prev, user_blocked: false }));
        toast.success(response?.data?.message);
      } else {
        toast.error(response?.data?.message);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSearchSubmit = (e) => {
      e.preventDefault();
      if(onSearch) onSearch(searchQuery);
  };

  const closeSearch = () => {
      setIsSearchMode(false);
      setSearchQuery("");
      if(onSearch) onSearch(""); 
  };

  if (isSearchMode) {
      return (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm z-10 h-[72px]">
            <button onClick={closeSearch} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-300">
                <MdArrowBack size={22} />
            </button>
            <form onSubmit={handleSearchSubmit} className="flex-1">
                <Input 
                    autoFocus
                    placeholder="Pretraži poruke..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus-visible:ring-primary h-10"
                />
            </form>
            <button onClick={closeSearch} className="text-sm font-medium text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 px-2">
                Otkaži
            </button>
        </div>
      );
  }

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-200/80 dark:border-slate-700 bg-white/95 dark:bg-slate-900/90 backdrop-blur z-10 min-h-[72px]">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {!isLargeScreen && (
          <button onClick={handleBack} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <MdArrowBack size={22} className="rtl:scale-x-[-1] text-slate-600" />
          </button>
        )}
        
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <CustomLink href={`/seller/${userData?.id}`}>
            <div className="relative group cursor-pointer">
              <CustomImage
                src={userData?.profile}
                alt="avatar"
                width={48}
                height={48}
                className="w-[48px] h-[48px] object-cover rounded-full ring-2 ring-slate-100 dark:ring-slate-700 group-hover:ring-primary transition-all"
              />
              {isOnline && (
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
              )}
            </div>
          </CustomLink>
        </div>
        
        {/* User Info */}
        <div className="flex flex-col min-w-0 justify-center">
          <div className="flex items-center gap-1.5">
            <CustomLink href={`/seller/${userData?.id}`} className="font-bold text-slate-900 dark:text-slate-100 truncate text-[15px] hover:underline decoration-slate-300 underline-offset-4">
              {userData?.name}
            </CustomLink>
            {isVerified && <MdVerified className="text-blue-500 text-sm flex-shrink-0" />}
            {rating && (
              <div className="flex items-center gap-0.5 bg-yellow-50 dark:bg-yellow-500/15 px-1.5 py-0.5 rounded text-[10px] font-bold text-yellow-700 dark:text-yellow-300 border border-yellow-100 dark:border-yellow-500/30">
                <MdStar className="text-yellow-500 text-xs" />
                <span>{rating}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-xs h-4">
            {isOnline ? (
              <span className="text-green-600 font-medium">Online</span>
            ) : (
              <span className="text-slate-500 dark:text-slate-400 font-medium truncate">
                {lastSeenText ? `Viđen/a: ${lastSeenText}` : "Offline"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-slate-100 dark:border-slate-700 ml-2">
        <div className="hidden md:flex flex-col items-end min-w-0 text-right">
           <div className="flex items-center gap-1 mb-0.5">
                {getItemStatusBadge(itemData?.status)}
                {isArchived ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-500/30">
                    ARHIVIRANO
                  </span>
                ) : null}
           </div>
           <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[120px] truncate block" title={itemData?.translated_name || itemData?.name}>
             {itemData?.translated_name || itemData?.name}
           </span>
           <span className="font-bold text-primary text-sm block">
             {formatPriceAbbreviated(itemData?.price)}
           </span>
        </div>

        {itemData?.image && (
          <CustomLink href={`/ad-details/${itemData?.slug}`} className="relative group flex-shrink-0">
             <CustomImage
              src={itemData?.image}
              alt="item"
              width={36}
              height={36}
              className="w-[36px] h-[36px] object-cover rounded-md border border-slate-200 dark:border-slate-700 group-hover:border-primary transition-colors"
            />
          </CustomLink>
        )}

        <div className="hidden sm:flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsSearchMode(true)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition-colors"
            title="Pretraži poruke"
          >
            <HiOutlineSearch size={18} />
          </button>
          <button
            type="button"
            onClick={onShowMedia}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition-colors"
            title="Mediji"
          >
            <HiOutlinePhotograph size={18} />
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 focus:outline-none">
              <HiOutlineDotsVertical size={20} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56 bg-white dark:bg-slate-900 z-50">
            
            {userData?.phone && (
                 <DropdownMenuItem className="cursor-pointer sm:hidden">
                    <HiPhone className="mr-2 h-4 w-4" />
                    <span>Pozovi korisnika</span>
                 </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={() => setIsSearchMode(true)} className="cursor-pointer">
                <HiOutlineSearch className="mr-2 h-4 w-4 text-slate-500" />
                <span>Pretraži u razgovoru</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={onShowMedia} className="cursor-pointer">
                <HiOutlinePhotograph className="mr-2 h-4 w-4 text-slate-500" />
                <span>Prikaži medije</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
                <CustomLink href={`/ad-details/${itemData?.slug}`} className="flex items-center w-full cursor-pointer px-2 py-1.5">
                    <HiEye className="mr-2 h-4 w-4 text-slate-500" />
                    <span>Pogledaj oglas</span>
                </CustomLink>
            </DropdownMenuItem>

            <div className="h-px bg-slate-100 my-1" />

            {/* MUTE / UNMUTE */}
            <DropdownMenuItem onClick={handleToggleMute} className="cursor-pointer">
                {isMuted ? (
                    <>
                        <HiOutlineVolumeUp className="mr-2 h-4 w-4 text-slate-500" />
                        <span>Uključi notifikacije</span>
                    </>
                ) : (
                    <>
                        <HiOutlineVolumeOff className="mr-2 h-4 w-4 text-slate-500" />
                        <span>Isključi notifikacije</span>
                    </>
                )}
            </DropdownMenuItem>

            {/* 🔥 ARCHIVE / UNARCHIVE */}
            {isArchived ? (
                <DropdownMenuItem onClick={onUnarchive} className="cursor-pointer text-blue-600 focus:bg-blue-50">
                    <HiOutlineInboxIn className="mr-2 h-4 w-4" />
                    <span>Vrati u inbox</span>
                </DropdownMenuItem>
            ) : (
                <DropdownMenuItem onClick={onArchive} className="cursor-pointer text-slate-500">
                    <HiOutlineArchive className="mr-2 h-4 w-4" />
                    <span>Arhiviraj</span>
                </DropdownMenuItem>
            )}

            <DropdownMenuItem
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={onDelete}
            >
              <HiOutlineTrash className="mr-2 h-4 w-4" />
              <span>Obriši razgovor</span>
            </DropdownMenuItem>
            
            <div className="h-px bg-slate-100 my-1" />
            
            <DropdownMenuItem
              className="cursor-pointer text-slate-600"
              onClick={isBlocked ? handleUnBlockUser : handleBlockUser}
            >
              <span>{isBlocked ? "Odblokiraj" : "Blokiraj"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default SelectedChatHeader;
