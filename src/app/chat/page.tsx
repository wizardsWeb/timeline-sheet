"use client";

import { useEffect, useState, useRef } from "react";
import { useUserStore } from "@/lib/store";
import { getTeamMessages, sendTeamMessage } from "@/app/chat-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";

type Message = {
  id: string;
  content: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    role: string;
  };
};

export default function ChatPage() {
  const { currentUserId, currentUserName, currentRole } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const data = await getTeamMessages();
      setMessages(
        data.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Polling every 5 seconds for prototype
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !currentUserId) return;

    const tempContent = inputValue.trim();
    setInputValue("");

    try {
      const newMsg = await sendTeamMessage(currentUserId, tempContent);
      setMessages((prev) => [...prev, newMsg]);
    } catch (error) {
      console.error("Failed to send message", error);
      setInputValue(tempContent); // restore on fail
    }
  };

  if (!currentUserId) {
    return (
      <div className="p-8 text-center">Please login to access team chat.</div>
    );
  }

  return (
    <div className="grid place-items-center flex-1 h-[calc(100vh-6rem)]">
      <Card className="w-full max-w-2xl h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle>Team Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0 relative">
          <ScrollArea className="h-full px-4 py-4" ref={scrollRef}>
            <div className="flex flex-col gap-4 justify-end min-h-full">
              {loading ? (
                <div className="text-center text-sm text-muted-foreground p-4">
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground p-4">
                  No messages yet. Say hello!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender.id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <Avatar className="h-8 w-8 mt-1 border">
                        <AvatarFallback className="text-xs">
                          {msg.sender.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`flex flex-col max-w-[70%] ${isMe ? "items-end" : "items-start"}`}
                      >
                        <span className="text-xs text-muted-foreground mb-1 flex gap-2">
                          <span className="font-medium text-foreground">
                            {msg.sender.name}
                          </span>
                          <span className="opacity-70 border rounded-sm px-1 text-[10px]">
                            {msg.sender.role}
                          </span>
                        </span>
                        <div
                          className={`px-3 py-2 rounded-lg text-sm ${
                            isMe
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="border-t p-4">
          <form onSubmit={handleSend} className="flex w-full gap-2 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              autoComplete="off"
            />
            <Button type="submit" disabled={!inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
