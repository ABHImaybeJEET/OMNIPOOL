import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import useStore from "../store/useStore";
import type { ChatConversation, ChatMessage } from "../store/useStore";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import {
  getConversations,
  getChatMessages,
  clearRequestChat,
  deleteRequestConversation,
  updateRequestStatus,
} from "../api/client";
import { connectSocket, joinChat, sendMessage } from "../api/socket";
import { MoreHorizontal, ArrowLeft } from "lucide-react";

const ChatPage: React.FC = () => {
  const { user, conversations, setConversations } = useStore();
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeletingChat, setIsDeletingChat] = useState(false);
  const [isChatCleared, setIsChatCleared] = useState(false);
  const [isChatActionsOpen, setIsChatActionsOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: "clear"; title: string; message: string }
    | { type: "delete"; title: string; message: string }
    | null
  >(null);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const location = useLocation();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatActionsRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const forceScrollToBottomRef = useRef(false);

  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < 120;
  };

  const normalizeConversationList = (items: unknown): ChatConversation[] =>
    Array.isArray(items) ? (items as ChatConversation[]) : [];

  const normalizeMessageList = (items: unknown): ChatMessage[] =>
    Array.isArray(items) ? (items as ChatMessage[]) : [];

  // Initialize socket and fetch conversations
  useEffect(() => {
    if (user) {
      connectSocket(user._id);
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const interval = window.setInterval(() => {
      fetchConversations();
      if (activeConversationId) {
        fetchMessages(activeConversationId);
      }
    }, 10000);

    return () => window.clearInterval(interval);
  }, [user, activeConversationId]);

  // Handle query parameter ?request_id=xxx
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const reqId = params.get("request_id");
    if (reqId) {
      setActiveConversationId(reqId);
      setShowMobileChat(true);
    }
  }, [location]);

  useEffect(() => {
    if (!conversations.length) {
      return;
    }

    const activeExists = activeConversationId
      ? conversations.some(
          (conversation) => conversation._id === activeConversationId,
        )
      : false;

    if (!activeConversationId || !activeExists) {
      const fallbackConversation = conversations[0];
      if (
        fallbackConversation &&
        fallbackConversation._id !== activeConversationId
      ) {
        setActiveConversationId(fallbackConversation._id);
      }
    }
  }, [activeConversationId, conversations]);

  // Load messages when an active conversation is selected
  useEffect(() => {
    if (activeConversationId) {
      setIsChatActionsOpen(false);
      forceScrollToBottomRef.current = true;
      joinChat(activeConversationId);
      fetchMessages(activeConversationId);
      setIsChatCleared(false);

      // Clear unread count for this conversation
      const updatedConversations = conversations.map((c) =>
        c._id === activeConversationId ? { ...c, unread_count: 0 } : c,
      );
      setConversations(updatedConversations);
    }
  }, [activeConversationId]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const shouldStickToBottom = distanceFromBottom < 120;
    const hasNewMessages = messages.length > previousMessageCountRef.current;

    if (
      forceScrollToBottomRef.current ||
      (hasNewMessages && shouldStickToBottom)
    ) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }

    forceScrollToBottomRef.current = false;
    previousMessageCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isChatActionsOpen &&
        chatActionsRef.current &&
        !chatActionsRef.current.contains(event.target as Node)
      ) {
        setIsChatActionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isChatActionsOpen]);

  // Add socket listener for incoming messages
  useEffect(() => {
    const socket = connectSocket(user ? user._id : "");

    const handleNewMessage = (msg: ChatMessage) => {
      // If it belongs to currently active chat, append it
      if (msg.request_id === activeConversationId) {
        const senderId =
          msg.sender_id &&
          typeof msg.sender_id === "object" &&
          "_id" in msg.sender_id
            ? msg.sender_id._id
            : msg.sender_id;

        forceScrollToBottomRef.current =
          senderId === user?._id || isNearBottom();
        setMessages((prev) => [...prev, msg]);
      } else {
        // Otherwise inc unread count
        setConversations((prev) =>
          prev.map((c) =>
            c._id === msg.request_id
              ? { ...c, unread_count: (c.unread_count || 0) + 1 }
              : c,
          ),
        );
      }
    };

    const handleRequestUpdate = (updatedRequest: ChatConversation) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === updatedRequest._id
            ? {
                ...c,
                status: updatedRequest.status ?? c.status,
                requester_completed: updatedRequest.requester_completed ?? c.requester_completed,
                owner_completed: updatedRequest.owner_completed ?? c.owner_completed,
                updatedAt: updatedRequest.updatedAt ?? c.updatedAt,
              }
            : c,
        ),
      );
    };

    const handleNewRequest = (newRequest: ChatConversation) => {
      setConversations((prev) => {
        const withoutExisting = prev.filter(
          (conv) => conv._id !== newRequest._id,
        );
        return [newRequest, ...withoutExisting].sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      });

      if (activeConversationId === newRequest._id) {
        fetchMessages(newRequest._id);
      }
    };

    const handleConversationDeleted = (payload: { request_id: string }) => {
      setConversations((prev) => {
        const remaining = prev.filter(
          (conv) => conv._id !== payload.request_id,
        );

        if (activeConversationId === payload.request_id) {
          const nextConversation = remaining[0];
          setActiveConversationId(nextConversation?._id ?? null);
          setMessages([]);
          setIsChatCleared(false);
        }

        return remaining;
      });
    };

    const handleChatCleared = (payload: { request_id: string }) => {
      if (activeConversationId === payload.request_id) {
        setMessages([]);
        setIsChatCleared(true);
      }
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === payload.request_id
            ? { ...conv, updatedAt: new Date().toISOString(), unread_count: 0 }
            : conv,
        ),
      );
    };

    socket.on("new_request", handleNewRequest);
    socket.on("new_message", handleNewMessage);
    socket.on("request_update", handleRequestUpdate);
    socket.on("conversation_deleted", handleConversationDeleted);
    socket.on("chat_cleared", handleChatCleared);

    return () => {
      socket.off("new_request", handleNewRequest);
      socket.off("new_message", handleNewMessage);
      socket.off("request_update", handleRequestUpdate);
      socket.off("conversation_deleted", handleConversationDeleted);
      socket.off("chat_cleared", handleChatCleared);
    };
  }, [activeConversationId, user]);

  const fetchConversations = async () => {
    try {
      const { data } = await getConversations();
      const conversationItems = normalizeConversationList(data?.data);
      setConversations(conversationItems);
      // Auto-select first if none selected and no query param used
      if (!activeConversationId && conversationItems.length > 0) {
        const params = new URLSearchParams(location.search);
        if (!params.get("request_id")) {
          setActiveConversationId(conversationItems[0]._id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch conversations", e);
    }
  };

  const fetchMessages = async (reqId: string) => {
    try {
      const { data } = await getChatMessages(reqId);
      const incomingMessages = normalizeMessageList(data?.data);
      setMessages((prev) => {
        if (
          prev.length === incomingMessages.length &&
          prev[0]?._id === incomingMessages[0]?._id &&
          prev[prev.length - 1]?._id ===
            incomingMessages[incomingMessages.length - 1]?._id
        ) {
          return prev;
        }

        return incomingMessages;
      });
    } catch (e) {
      console.error("Failed to fetch messages", e);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversationId || !user) return;

    const activeConv = conversations.find(
      (c) => c._id === activeConversationId,
    );
    if (!activeConv) return;

    const isRequester =
      activeConv.requester_id &&
      typeof activeConv.requester_id === "object" &&
      "_id" in activeConv.requester_id
        ? activeConv.requester_id._id === user._id
        : activeConv.requester_id === user._id;

    // The receiver is the OTHER person in the request
    const receiverId = isRequester
      ? activeConv.owner_id &&
        typeof activeConv.owner_id === "object" &&
        "_id" in activeConv.owner_id
        ? activeConv.owner_id._id
        : activeConv.owner_id
      : activeConv.requester_id &&
          typeof activeConv.requester_id === "object" &&
          "_id" in activeConv.requester_id
        ? activeConv.requester_id._id
        : activeConv.requester_id;

    const msgData = {
      request_id: activeConversationId,
      sender_id: user._id,
      receiver_id: receiverId,
      message: messageInput.trim(),
    };

    // Emit via socket
    sendMessage(msgData);
    forceScrollToBottomRef.current = true;
    setMessageInput("");
  };

  const getUserId = (userValue: string | { _id: string } | null | undefined) =>
    userValue && typeof userValue === "object" && "_id" in userValue
      ? userValue._id
      : userValue;

  const handleStatusUpdate = async (
    status: "accepted" | "rejected" | "completed",
  ) => {
    if (!currentConversation || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      const { data } = await updateRequestStatus(currentConversation._id, {
        status,
      });
      const updatedConversation = data?.data as ChatConversation | undefined;
      if (!updatedConversation?._id) {
        throw new Error("Unexpected request update response");
      }
      const updatedConversations = conversations.map((conv) =>
        conv._id === updatedConversation._id
          ? {
              ...conv,
              status: updatedConversation.status ?? conv.status,
              requester_completed: updatedConversation.requester_completed ?? conv.requester_completed,
              owner_completed: updatedConversation.owner_completed ?? conv.owner_completed,
              updatedAt: updatedConversation.updatedAt ?? conv.updatedAt,
            }
          : conv,
      );
      setConversations(updatedConversations);
      fetchMessages(updatedConversation._id);
    } catch (e) {
      console.error("Failed to update request status", e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteChat = async () => {
    if (!currentConversation || isDeletingChat) return;

    if (currentConversation.status === "accepted") {
      setPendingAction({
        type: "delete",
        title: "Delete disabled",
        message:
          "Accepted requests cannot be deleted from chat. Complete or reject the request first.",
      });
      return;
    }

    setPendingAction({
      type: "delete",
      title: "Delete chat",
      message:
        "Delete this chat and all of its messages? This cannot be undone.",
    });
  };

  const confirmDeleteChat = async () => {
    if (!currentConversation || isDeletingChat) return;

    setIsDeletingChat(true);
    try {
      await deleteRequestConversation(currentConversation._id);
      const remainingConversations = conversations.filter(
        (conv) => conv._id !== currentConversation._id,
      );
      setConversations(remainingConversations);
      setMessages([]);
      setIsChatCleared(false);

      const nextConversation = remainingConversations[0];
      if (nextConversation) {
        setActiveConversationId(nextConversation._id);
      } else {
        setActiveConversationId(null);
      }
      fetchConversations();
      setPendingAction(null);
    } catch (e) {
      const errorMessage =
        (e as any)?.response?.data?.error || "Failed to delete conversation";
      setPendingAction({
        type: "delete",
        title: "Delete failed",
        message: errorMessage,
      });
      console.error("Failed to delete conversation", e);
    } finally {
      setIsDeletingChat(false);
    }
  };

  const handleClearChat = async () => {
    if (!currentConversation || isDeletingChat) return;

    setPendingAction({
      type: "clear",
      title: "Clear chat",
      message:
        "Clear this chat history? The thread will stay active so you can chat again later.",
    });
  };

  const confirmClearChat = async () => {
    if (!currentConversation || isDeletingChat) return;

    setIsDeletingChat(true);
    try {
      await clearRequestChat(currentConversation._id);
      setMessages([]);
      setIsChatCleared(true);
      setConversations((prev) =>
        prev.map((conv) =>
          conv._id === currentConversation._id
            ? {
                ...conv,
                updatedAt: new Date().toISOString(),
                unread_count: 0,
              }
            : conv,
        ),
      );
      fetchConversations();
      setPendingAction(null);
    } catch (e) {
      const errorMessage =
        (e as any)?.response?.data?.error || "Failed to clear chat";
      setPendingAction({
        type: "clear",
        title: "Clear failed",
        message: errorMessage,
      });
      console.error("Failed to clear chat", e);
    } finally {
      setIsDeletingChat(false);
    }
  };

  const currentConversation = conversations.find(
    (c) => c._id === activeConversationId,
  );
  const isCurrentUserOwner = currentConversation
    ? getUserId(currentConversation.owner_id) === user?._id
    : false;
  const isCurrentUserParticipant = currentConversation
    ? getUserId(currentConversation.owner_id) === user?._id ||
      getUserId(currentConversation.requester_id) === user?._id
    : false;
  const otherUser = currentConversation
    ? currentConversation.requester_id &&
      typeof currentConversation.requester_id === "object" &&
      "_id" in currentConversation.requester_id &&
      currentConversation.requester_id._id === user?._id
      ? currentConversation.owner_id
      : currentConversation.requester_id
    : null;

  return (
    <div className="min-h-screen pt-20 md:pt-24 pb-4 md:pb-12 px-0 md:px-4 sm:px-8 flex flex-col bg-bg-primary relative">
      {/* Background decoration */}
      <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-black/[0.02] to-transparent pointer-events-none z-0" />
      
      <div className="relative z-10 flex-1 flex max-w-[1400px] mx-auto w-full border-x-0 border-y md:border border-border-default/50 md:rounded-3xl overflow-hidden shadow-2xl shadow-black/[0.03] bg-bg-primary h-[calc(100vh-120px)] md:h-[calc(100vh-140px)]">
        {/* Left Sidebar: Conversations List */}
        <div className={`w-full md:w-1/3 md:min-w-[320px] md:max-w-[400px] border-r border-border-default/50 bg-[#fafafa] flex flex-col ${showMobileChat ? "hidden md:flex" : "flex"}`}>
          <div className="h-[80px] px-6 border-b border-border-default/50 bg-white/40 backdrop-blur-md z-10 flex flex-col justify-center shrink-0">
            <h2 className="text-xl font-bold tracking-tight text-text-primary">Inboxes</h2>
            <p className="text-xs font-medium text-text-muted mt-0.5">Manage hardware requests</p>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {conversations.length === 0 ? (
              <div className="px-8 py-10 text-center text-text-muted text-sm">
                No active conversations. Start one by requesting hardware in the
                Registry.
              </div>
            ) : (
              conversations.map((conv) => {
                const isRequester =
                  conv.requester_id &&
                  typeof conv.requester_id === "object" &&
                  "_id" in conv.requester_id
                    ? conv.requester_id._id === user?._id
                    : conv.requester_id === user?._id;
                const contact = isRequester ? conv.owner_id : conv.requester_id;
                const contactObject =
                  contact && typeof contact === "object"
                    ? contact
                    : { name: "Unknown User" };
                const hwItem =
                  conv.hardware_id && typeof conv.hardware_id === "object"
                    ? conv.hardware_id
                    : { name: "Hardware" };

                return (
                  <button
                    key={conv._id}
                    onClick={() => {
                      setActiveConversationId(conv._id);
                      setShowMobileChat(true);
                    }}
                    className={`w-full text-left mx-3 my-1.5 p-3 rounded-2xl transition-all duration-200 flex items-center justify-between group ${
                      activeConversationId === conv._id
                        ? "bg-white shadow-sm border border-border-default/40"
                        : "hover:bg-white/60 border border-transparent"
                    }`}
                    style={{ width: 'calc(100% - 24px)' }}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center font-bold shrink-0 shadow-inner ${activeConversationId === conv._id ? 'bg-gradient-to-br from-accent-indigo to-accent-violet' : 'bg-text-secondary'}`}>
                        {contactObject.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="overflow-hidden">
                        <div className={`font-semibold truncate transition-colors ${activeConversationId === conv._id ? 'text-text-primary' : 'text-text-secondary group-hover:text-text-primary'}`}>
                          {contactObject.name}
                        </div>
                        <div className="text-xs text-text-muted truncate mt-0.5">
                          <span className="font-medium">Ref:</span> {hwItem.name}
                        </div>
                      </div>
                    </div>
                    {conv.unread_count ? (
                      <div className="bg-accent-indigo text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shrink-0 shadow-sm">
                        {conv.unread_count}
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area: Chat Window */}
        <div className={`w-full flex-1 flex flex-col bg-bg-primary relative overflow-hidden ${showMobileChat ? "flex" : "hidden md:flex"}`}>
          {activeConversationId && currentConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-[80px] border-b border-border-default/50 px-4 md:px-8 flex justify-between items-center bg-white/70 backdrop-blur-xl shrink-0 z-20 absolute top-0 inset-x-0">
                <div className="flex items-center gap-2 md:gap-4 min-w-0">
                  <button
                    type="button"
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden p-1.5 -ml-1 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-secondary transition-colors shrink-0"
                    aria-label="Back to inboxes"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="w-[40px] h-[40px] md:w-[42px] md:h-[42px] rounded-xl bg-gradient-to-br from-text-secondary to-text-primary text-white flex items-center justify-center font-bold shadow-sm shrink-0">
                    {otherUser &&
                    typeof otherUser === "object" &&
                    "name" in otherUser &&
                    otherUser.name
                      ? otherUser.name.charAt(0).toUpperCase()
                      : "?"}
                  </div>
                  <div className="flex flex-col justify-center min-w-0">
                    <h3 className="font-bold tracking-tight text-text-primary truncate text-[15px] leading-tight">
                      {otherUser &&
                      typeof otherUser === "object" &&
                      "name" in otherUser
                        ? otherUser.name
                        : "User"}
                    </h3>
                    <div className="text-xs text-text-muted truncate mt-0.5 font-medium font-mono">
                      {currentConversation.hardware_id &&
                      typeof currentConversation.hardware_id === "object" &&
                      "name" in currentConversation.hardware_id
                        ? currentConversation.hardware_id.name
                        : "Item"}{" "}
                      <span className="opacity-60">(Qty: {currentConversation.quantity_requested})</span>
                    </div>
                  </div>
                </div>
                {/* Status & Actions Container */}
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                  <span
                    className={`text-[9px] md:text-[10px] px-2 py-1 md:px-3 md:py-1.5 rounded-lg font-bold tracking-widest uppercase font-mono border ${
                      currentConversation.status === "accepted"
                        ? "bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20"
                        : currentConversation.status === "rejected"
                          ? "bg-accent-rose/10 text-accent-rose border-accent-rose/20"
                          : currentConversation.status === "completed"
                            ? "bg-bg-tertiary text-text-secondary border-border-default"
                            : "bg-accent-amber/10 text-accent-amber border-accent-amber/20"
                    }`}
                  >
                    {String(
                      currentConversation.status ?? "pending",
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="relative" ref={chatActionsRef}>
                      <button
                        type="button"
                        onClick={() => setIsChatActionsOpen((prev) => !prev)}
                        className={`h-[30px] w-[30px] rounded border flex items-center justify-center transition-all ${isChatActionsOpen ? 'bg-bg-tertiary border-border-default/80 text-text-primary shadow-inner' : 'bg-white border-border-default/40 text-text-muted hover:text-text-primary hover:border-border-default/70 hover:shadow-sm'}`}
                        title="More chat actions"
                        disabled={isDeletingChat}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {isChatActionsOpen ? (
                        <div className="absolute right-0 mt-2 w-48 rounded-[14px] border border-border-default bg-white shadow-xl shadow-black/5 z-20 p-1.5 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setIsChatActionsOpen(false);
                              handleClearChat();
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-bg-secondary transition-colors"
                          >
                            Clear Messages
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (currentConversation.status === "accepted") {
                                  return;
                              }
                              setIsChatActionsOpen(false);
                              handleDeleteChat();
                            }}
                            disabled={currentConversation.status === "accepted"}
                            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-accent-rose hover:bg-accent-rose/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              currentConversation.status === "accepted"
                                ? "Accepted requests cannot be deleted"
                                : "Permanently delete this conversation"
                            }
                          >
                            Delete Chat
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Banner (just under header) */}
              {((isCurrentUserOwner && currentConversation.status === "pending") ||
                (isCurrentUserParticipant && currentConversation.status === "accepted")) && (
                <div className="h-[50px] border-b border-border-default/50 px-4 md:px-8 flex justify-between items-center bg-bg-secondary/95 backdrop-blur-md shrink-0 z-20 absolute top-[80px] inset-x-0">
                  <span className="text-xs font-semibold text-text-secondary truncate pr-2">
                    {currentConversation.status === "pending"
                      ? "Review request status"
                      : isCurrentUserOwner
                        ? currentConversation.requester_completed
                          ? "Partner marked completed"
                          : "Mark when handover is done"
                        : currentConversation.owner_completed
                          ? "Partner marked completed"
                          : "Mark when equipment is received"}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {currentConversation.status === "pending" ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => handleStatusUpdate("accepted")}
                          isLoading={isUpdatingStatus}
                          className="px-2.5 py-1 md:px-3 md:py-1.5 h-auto text-xs"
                        >
                          Accept
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={() => handleStatusUpdate("rejected")}
                          isLoading={isUpdatingStatus}
                          className="px-2.5 py-1 md:px-3 md:py-1.5 h-auto text-xs"
                        >
                          Reject
                        </Button>
                      </>
                    ) : (
                      (() => {
                        const hasCurrentConfirmed = isCurrentUserOwner
                          ? currentConversation.owner_completed
                          : currentConversation.requester_completed;

                        const hasPartnerConfirmed = isCurrentUserOwner
                          ? currentConversation.requester_completed
                          : currentConversation.owner_completed;

                        if (hasCurrentConfirmed) {
                          return (
                            <span className="text-[11px] text-text-muted font-medium">
                              Waiting for partner...
                            </span>
                          );
                        }

                        return (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStatusUpdate("completed")}
                            isLoading={isUpdatingStatus}
                            className="px-2.5 py-1 md:px-3 md:py-1.5 h-auto text-xs font-semibold"
                          >
                            {hasPartnerConfirmed ? "Confirm" : "Mark Complete"}
                          </Button>
                        );
                      })()
                    )}
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <div
                ref={messagesContainerRef}
                className={`flex-1 overflow-y-auto px-4 md:px-8 pb-[100px] space-y-6 bg-bg-primary relative ${
                  ((isCurrentUserOwner && currentConversation.status === "pending") ||
                  (isCurrentUserParticipant && currentConversation.status === "accepted"))
                    ? "pt-[136px] md:pt-[146px]"
                    : "pt-[96px] md:pt-[116px]"
                }`}
              >
                {/* Subtle grid in background just for chat area */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] pointer-events-none -z-10" />

                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-text-muted">
                    <p className="font-medium text-text-secondary">
                      {isChatCleared ? "Chat cleared." : "This is the beginning of the conversation."}
                    </p>
                    <p className="text-sm mt-1">
                      {isChatCleared
                        ? "Send a new message to continue this thread later."
                        : "Send a message to start aligning on hardware limits."}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe =
                      (msg.sender_id &&
                      typeof msg.sender_id === "object" &&
                      "_id" in msg.sender_id
                        ? msg.sender_id._id
                        : msg.sender_id) === user?._id;
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[70%] px-5 py-3.5 text-[15px] leading-relaxed relative shadow-sm ${
                            isMe
                              ? "bg-gradient-to-br from-accent-indigo to-accent-indigo/90 text-white rounded-2xl rounded-tr-sm"
                              : "bg-white border border-border-default/50 text-text-primary rounded-2xl rounded-tl-sm shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.message}</p>
                          <span
                            className={`text-[10px] block mt-1.5 font-medium ${isMe ? "text-indigo-100/70" : "text-text-muted/70"}`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="px-4 md:px-8 py-4 md:py-6 bg-white/70 backdrop-blur-xl shrink-0 absolute bottom-0 inset-x-0 border-t border-border-default/50 z-20">
                <form
                  onSubmit={handleSend}
                  className="flex gap-2 md:gap-3 bg-bg-primary p-1.5 md:p-2 rounded-2xl border border-border-default/60 shadow-sm focus-within:border-accent-indigo/40 focus-within:ring-2 focus-within:ring-accent-indigo/10 transition-all"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent px-3 py-1.5 md:px-4 md:py-2 text-text-primary placeholder-text-muted focus:outline-none text-sm md:text-base"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="bg-accent-indigo hover:bg-accent-violet disabled:opacity-40 disabled:hover:bg-accent-indigo text-white rounded-xl px-4 py-2 md:px-6 md:py-2.5 font-semibold transition-all flex items-center justify-center gap-2 shadow-sm text-sm md:text-base shrink-0"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-bg-primary relative text-center px-6">
              <div className="absolute inset-0 bg-[#fafafa] bg-[url('/grid.svg')] bg-center opacity-[0.03] pointer-events-none -z-10" />
              <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-border-default/30 shadow-black/[0.04] rotate-3 hover:rotate-6 transition-transform">
                <svg className="w-10 h-10 text-accent-indigo/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Select a Conversation</h3>
              <p className="text-text-secondary text-sm max-w-sm leading-relaxed">
                Choose a hardware request from the sidebar to start discussing details and finalizing equipment handovers.
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        title={pendingAction?.title}
        size="sm"
      >
        <div className="space-y-6">
          <p className="text-sm font-medium text-text-secondary leading-relaxed">
            {pendingAction?.message}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPendingAction(null)}
              className="bg-[#fafafa]"
            >
              Cancel
            </Button>
            {pendingAction?.type === "clear" ? (
              <Button
                type="button"
                onClick={confirmClearChat}
                isLoading={isDeletingChat}
                className="bg-text-primary hover:bg-black text-white shadow-sm"
              >
                Clear Chat
              </Button>
            ) : pendingAction?.title === "Delete disabled" ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPendingAction(null)}
              >
                Close
              </Button>
            ) : (
              <Button
                type="button"
                variant="danger"
                onClick={confirmDeleteChat}
                isLoading={isDeletingChat}
                className="shadow-sm"
              >
                Delete Permanently
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChatPage;
