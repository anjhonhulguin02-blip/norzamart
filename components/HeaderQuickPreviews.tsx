"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { formatPeso } from "@/lib/formatProduct";
import { useAnchoredMenuPosition } from "@/lib/useAnchoredMenuPosition";
import {
  ArrowRightIcon,
  BasketIcon,
  ChatIcon,
  CloseIcon,
  HeartIcon,
  StoreIcon,
} from "./ui/NorzaIcons";

type PreviewType = "messages" | "wishlist";
type LoadState = "idle" | "loading" | "ready" | "error";

interface ConversationPreview {
  _id: string;
  buyer?: { _id: string; name?: string; avatar?: string };
  seller?: { _id: string; storeName?: string; storeLogo?: string };
  product?: { name?: string };
  lastMessage?: string;
  lastMessageAt?: string;
  buyerUnread?: number;
  sellerUnread?: number;
}

interface WishlistPreview {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    image?: string;
    seller?: { storeName?: string };
  } | null;
}

interface HeaderQuickPreviewsProps {
  chatCount: number;
}

function timeAgo(dateString?: string) {
  if (!dateString) return "";

  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return "";

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

function PreviewSkeleton() {
  return (
    <div aria-label="Loading preview" className="divide-y divide-line" role="status">
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex min-h-[4.5rem] items-center gap-3 px-4 py-3">
          <span className="nm-shimmer h-10 w-10 shrink-0 rounded-control" />
          <span className="min-w-0 flex-1 space-y-2">
            <span className="nm-shimmer block h-3 w-2/5 rounded-full" />
            <span className="nm-shimmer block h-2.5 w-4/5 rounded-full" />
          </span>
        </div>
      ))}
      <span className="sr-only">Loading recent items.</span>
    </div>
  );
}

export default function HeaderQuickPreviews({ chatCount }: HeaderQuickPreviewsProps) {
  const reduceMotion = useReducedMotion();
  const [activePreview, setActivePreview] = useState<PreviewType | null>(null);
  const [messageState, setMessageState] = useState<LoadState>("idle");
  const [wishlistState, setWishlistState] = useState<LoadState>("idle");
  const [messages, setMessages] = useState<ConversationPreview[]>([]);
  const [myUserId, setMyUserId] = useState("");
  const [wishlist, setWishlist] = useState<WishlistPreview[]>([]);

  const messageButtonRef = useRef<HTMLButtonElement>(null);
  const wishlistButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggersRef = useRef<HTMLDivElement>(null);
  const { pos: messagePos, measure: measureMessage } = useAnchoredMenuPosition(messageButtonRef);
  const { pos: wishlistPos, measure: measureWishlist } = useAnchoredMenuPosition(wishlistButtonRef);

  useEffect(() => {
    if (!activePreview) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggersRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setActivePreview(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const trigger = activePreview === "messages" ? messageButtonRef.current : wishlistButtonRef.current;
      setActivePreview(null);
      trigger?.focus();
    };
    const closeOnResize = () => setActivePreview(null);

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnResize);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnResize);
    };
  }, [activePreview]);

  const loadMessages = async () => {
    const hadData = messageState === "ready";
    if (!hadData) setMessageState("loading");

    try {
      const response = await fetch("/api/chat/conversations");
      if (!response.ok) throw new Error("Unable to load conversations");

      const data = (await response.json()) as {
        conversations?: ConversationPreview[];
        myUserId?: string;
      };
      setMessages(data.conversations || []);
      setMyUserId(data.myUserId || "");
      setMessageState("ready");
    } catch {
      if (!hadData) setMessageState("error");
    }
  };

  const loadWishlist = async () => {
    const hadData = wishlistState === "ready";
    if (!hadData) setWishlistState("loading");

    try {
      const response = await fetch("/api/wishlist");
      if (!response.ok) throw new Error("Unable to load wishlist");

      const data = (await response.json()) as { items?: WishlistPreview[] };
      setWishlist((data.items || []).filter((item) => Boolean(item.product)));
      setWishlistState("ready");
    } catch {
      if (!hadData) setWishlistState("error");
    }
  };

  const togglePreview = (type: PreviewType) => {
    if (activePreview === type) {
      setActivePreview(null);
      return;
    }

    if (type === "messages") {
      measureMessage(360);
      void loadMessages();
    } else {
      measureWishlist(360);
      void loadWishlist();
    }
    setActivePreview(type);
  };

  const closeAndRestoreFocus = () => {
    const trigger = activePreview === "messages" ? messageButtonRef.current : wishlistButtonRef.current;
    setActivePreview(null);
    trigger?.focus();
  };

  const activePosition = activePreview === "messages" ? messagePos : wishlistPos;
  const popupTitle = activePreview === "messages" ? "Messages" : "Wishlist";
  const popupDescription = activePreview === "messages" ? "Recent conversations" : "Recently saved products";
  const PopupIcon = activePreview === "messages" ? ChatIcon : HeartIcon;

  const popup = typeof document !== "undefined" && createPortal(
    <AnimatePresence>
      {activePreview && activePosition && (
        <motion.div
          ref={popoverRef}
          id={`${activePreview}-quick-preview`}
          initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -5, scale: 0.99 }}
          transition={{ duration: reduceMotion ? 0 : 0.16, ease: "easeOut" }}
          style={{ top: activePosition.top, left: activePosition.left, width: activePosition.width }}
          role="dialog"
          aria-labelledby={`${activePreview}-preview-title`}
          className="fixed z-[60] max-h-[min(30rem,calc(100vh-6rem))] overflow-y-auto rounded-card border border-line bg-paper shadow-float"
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control ${activePreview === "messages" ? "bg-mint-wash text-basil" : "bg-tomato/10 text-tomato"}`}>
              <PopupIcon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p id={`${activePreview}-preview-title`} className="font-display text-sm font-semibold text-basil">
                {popupTitle}
              </p>
              <p className="mt-0.5 text-[11px] text-stone">{popupDescription}</p>
            </div>
            <button
              type="button"
              onClick={closeAndRestoreFocus}
              aria-label={`Close ${popupTitle.toLowerCase()} preview`}
              className="nm-icon-button !h-11 !w-11 shrink-0"
            >
              <CloseIcon size={17} />
            </button>
          </div>

          {activePreview === "messages" ? (
            messageState === "loading" || messageState === "idle" ? (
              <PreviewSkeleton />
            ) : messageState === "error" ? (
              <div className="px-5 py-6 text-center" role="alert">
                <p className="text-sm font-bold text-ink">Couldn&apos;t load messages.</p>
                <p className="mt-1 text-xs text-stone">Check your connection and try again.</p>
                <button type="button" onClick={() => void loadMessages()} className="mt-3 min-h-11 rounded-control border border-line px-4 text-xs font-black text-basil hover:bg-mint-wash">
                  Try again
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="px-5 py-7 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-mint-wash text-basil"><ChatIcon size={20} /></span>
                <p className="mt-3 text-sm font-bold text-ink">No conversations yet.</p>
                <p className="mt-1 text-xs leading-relaxed text-stone">Messages with local sellers will appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-line">
                {messages.slice(0, 3).map((conversation) => {
                  const isBuyer = conversation.buyer?._id === myUserId;
                  const name = isBuyer ? conversation.seller?.storeName || "Local seller" : conversation.buyer?.name || "Customer";
                  const avatar = isBuyer ? conversation.seller?.storeLogo : conversation.buyer?.avatar;
                  const unread = isBuyer ? conversation.buyerUnread || 0 : conversation.sellerUnread || 0;

                  return (
                    <Link
                      key={conversation._id}
                      href={`/messages/${conversation._id}`}
                      onClick={() => setActivePreview(null)}
                      className="group flex min-h-[4.5rem] items-center gap-3 px-4 py-3 transition-colors hover:bg-mint-wash/70 focus-visible:bg-mint-wash/70"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-control bg-mint-wash text-basil">
                        {avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <StoreIcon size={18} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className={`min-w-0 flex-1 truncate text-xs text-ink ${unread > 0 ? "font-black" : "font-bold"}`}>{name}</span>
                          <span className="shrink-0 text-[10px] text-stone">{timeAgo(conversation.lastMessageAt)}</span>
                        </span>
                        <span className={`mt-1 block truncate text-[11px] ${unread > 0 ? "font-semibold text-ink/75" : "text-stone"}`}>
                          {conversation.lastMessage || "Start a conversation"}
                        </span>
                        {conversation.product?.name && <span className="mt-0.5 block truncate text-[10px] text-basil/75">About {conversation.product.name}</span>}
                      </span>
                      {unread > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-tomato px-1 text-[9px] font-black text-white" aria-label={`${unread} unread messages`}>
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )
          ) : wishlistState === "loading" || wishlistState === "idle" ? (
            <PreviewSkeleton />
          ) : wishlistState === "error" ? (
            <div className="px-5 py-6 text-center" role="alert">
              <p className="text-sm font-bold text-ink">Couldn&apos;t load your wishlist.</p>
              <p className="mt-1 text-xs text-stone">Check your connection and try again.</p>
              <button type="button" onClick={() => void loadWishlist()} className="mt-3 min-h-11 rounded-control border border-line px-4 text-xs font-black text-basil hover:bg-mint-wash">
                Try again
              </button>
            </div>
          ) : wishlist.length === 0 ? (
            <div className="px-5 py-7 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-tomato/10 text-tomato"><HeartIcon size={20} /></span>
              <p className="mt-3 text-sm font-bold text-ink">Your wishlist is empty.</p>
              <p className="mt-1 text-xs leading-relaxed text-stone">Save products with the heart button to find them here.</p>
            </div>
          ) : (
            <div className="divide-y divide-line">
              {wishlist.slice(0, 3).map((item) => {
                if (!item.product) return null;

                return (
                  <Link
                    key={item._id}
                    href={`/product/${item.product._id}`}
                    onClick={() => setActivePreview(null)}
                    className="group flex min-h-[4.5rem] items-center gap-3 px-4 py-3 transition-colors hover:bg-tomato/5 focus-visible:bg-tomato/5"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-control border border-line bg-white text-basil">
                      {item.product.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.product.image} alt="" className="h-full w-full object-contain p-1" />
                      ) : (
                        <BasketIcon size={19} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-black text-ink">{item.product.name}</span>
                      <span className="mt-1 block truncate text-[10px] text-stone">{item.product.seller?.storeName || "Local seller"}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs font-black text-basil">{formatPeso(item.product.price)}</span>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="border-t border-line bg-cream-mist/45 p-3">
            <Link
              href={activePreview === "messages" ? "/messages" : "/dashboard/wishlist"}
              onClick={() => setActivePreview(null)}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-control bg-basil px-4 text-xs font-black text-white transition-colors hover:bg-basil-light"
            >
              {activePreview === "messages" ? "Open messages" : "View wishlist"}
              <ArrowRightIcon size={15} />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );

  return (
    <div ref={triggersRef} className="flex items-center gap-1 sm:gap-2">
      <button
        ref={messageButtonRef}
        type="button"
        onClick={() => togglePreview("messages")}
        aria-label={chatCount > 0 ? `Messages, ${chatCount} unread` : "Messages"}
        aria-expanded={activePreview === "messages"}
        aria-haspopup="dialog"
        aria-controls="messages-quick-preview"
        className="nm-icon-button relative"
      >
        <ChatIcon size={20} />
        {chatCount > 0 && (
          <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-tomato px-1 text-[9px] font-black text-white">
            {chatCount > 9 ? "9+" : chatCount}
          </span>
        )}
      </button>

      <button
        ref={wishlistButtonRef}
        type="button"
        onClick={() => togglePreview("wishlist")}
        aria-label="Wishlist"
        aria-expanded={activePreview === "wishlist"}
        aria-haspopup="dialog"
        aria-controls="wishlist-quick-preview"
        className="nm-icon-button relative !text-tomato"
      >
        <HeartIcon size={20} />
      </button>

      {popup}
    </div>
  );
}
