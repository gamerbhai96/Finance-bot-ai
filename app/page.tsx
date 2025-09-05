"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Bot, User, Shield, TrendingUp, AlertTriangle, Trash2, History } from "lucide-react"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  sources?: string[]
}

declare global {
  interface Window {
    puter?: any
  }
}

export default function FinBot() {
  const formatTime = (date: Date) => {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const period = hours >= 12 ? "PM" : "AM"
    const hours12 = hours % 12 === 0 ? 12 : hours % 12
    const paddedMinutes = minutes.toString().padStart(2, "0")
    return `${hours12.toString().padStart(2, "0")}:${paddedMinutes} ${period}`
  }
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [puterStatus, setPuterStatus] = useState<"loading" | "ready" | "error">("loading")
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load chat history from localStorage on mount
  useEffect(() => {
    const loadChatHistory = () => {
      try {
        const saved = localStorage.getItem("finbot-chat-history")
        if (saved) {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Convert timestamp strings back to Date objects
            const messagesWithDates = parsed.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
            setMessages(messagesWithDates)
            return
          }
        }
        // No saved history, show welcome message
        setMessages([{
          id: "1",
          content: "Hello! I'm FinBot, your AI Financial Assistant. I can help you understand banking terms, loans, investments, and protect you from fraud. What financial question can I help you with today?",
          sender: "bot",
          timestamp: new Date(),
          sources: ["FinBot AI Assistant"],
        }])
      } catch (error) {
        console.log("Failed to load chat history:", error)
        // Fallback to welcome message
        setMessages([{
          id: "1",
          content: "Hello! I'm FinBot, your AI Financial Assistant. I can help you understand banking terms, loans, investments, and protect you from fraud. What financial question can I help you with today?",
          sender: "bot",
          timestamp: new Date(),
          sources: ["FinBot AI Assistant"],
        }])
      }
    }

    loadChatHistory()
  }, [])

  // Save chat history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("finbot-chat-history", JSON.stringify(messages))
      } catch (error) {
        console.log("Failed to save chat history:", error)
      }
    }
  }, [messages])

  const clearChatHistory = () => {
    setMessages([{
      id: "1",
      content: "Hello! I'm FinBot, your AI Financial Assistant. I can help you understand banking terms, loans, investments, and protect you from fraud. What financial question can I help you with today?",
      sender: "bot",
      timestamp: new Date(),
      sources: ["FinBot AI Assistant"],
    }])
    localStorage.removeItem("finbot-chat-history")
    setShowClearConfirm(false)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const loadPuter = () => {
      // Add script to head
      const script = document.createElement("script")
      script.src = "https://js.puter.com/v2/"
      script.async = true

      script.onload = () => {
        // Wait for puter to initialize
        setTimeout(() => {
          if (window.puter?.ai) {
            console.log("✅ Puter AI ready")
            setPuterStatus("ready")
          } else {
            console.log("❌ Puter AI not available")
            setPuterStatus("error")
          }
        }, 1000)
      }

      script.onerror = () => {
        console.log("❌ Failed to load puter.js")
        setPuterStatus("error")
      }

      document.head.appendChild(script)
    }

    loadPuter()
  }, [])

  // Hide any floating Puter AI button if injected by the SDK
  useEffect(() => {
    const style = document.createElement("style")
    style.setAttribute("data-finbot-style", "hide-puter-button")
    style.innerHTML = `
      /* Best-effort: hide common floating button patterns if present */
      .puter-floating-button, .puter-ai-button, #puter-ai-button { display: none !important; }
    `
    document.head.appendChild(style)

    const tryRemoveFloating = () => {
      const all = Array.from(document.querySelectorAll<HTMLElement>("body *"))
      for (const el of all) {
        const cs = window.getComputedStyle(el)
        if (cs.position === "fixed" || cs.position === "sticky") {
          const txt = (el.innerText || "").toLowerCase()
          if (txt.includes("puter") && (txt.includes("ai") || txt.includes("chat") || txt.includes("assistant"))) {
            el.style.display = "none"
          }
        }
      }
    }

    // Initial attempt and observe future DOM changes
    tryRemoveFloating()
    const obs = new MutationObserver(() => tryRemoveFloating())
    obs.observe(document.body, { childList: true, subtree: true })

    return () => {
      obs.disconnect()
      style.remove()
    }
  }, [])

  const getAIResponse = async (question: string): Promise<string> => {
    if (puterStatus === "ready" && window.puter?.ai) {
      try {
        const response: any = await window.puter.ai.chat(
          `You are FinBot, a professional financial assistant specializing in banking, investments, loans, and financial security.\n\nProvide a comprehensive, detailed response to the user's question. Structure your answer with clear sections and use bullet points for easy reading. Include:\n- Detailed explanations of concepts\n- Practical examples when relevant\n- Important warnings or considerations\n- Actionable advice\n- Sources or references when appropriate\n\nBe thorough but accessible. Use professional language that's easy to understand.\n\nQuestion: ${question}`,
          {
            model: "gpt-4o-mini",
            max_tokens: 1200,
            temperature: 0.7,
          }
        )
        if (response?.message?.content) {
          return response.message.content
        }
      } catch (error) {
        console.log("Puter AI error, using fallback:", error)
      }
    }

    // Enhanced fallback responses
    const q = question.toLowerCase()

    if (q.includes("phishing") || q.includes("scam") || q.includes("fraud")) {
      return `🛡️ **Phishing & Fraud Protection**

**Warning Signs:**
• Urgent messages about account suspension
• Requests for passwords or personal info
• Suspicious links or attachments
• Poor grammar/spelling
• Generic greetings

**Protection Steps:**
• Never click suspicious links
• Verify by calling your bank directly
• Use two-factor authentication
• Monitor accounts regularly
• Keep software updated

**If Targeted:**
• Don't respond or click anything
• Report to your bank immediately
• Change passwords if compromised

*Sources: FTC, Anti-Phishing Working Group*`
    }

    if (q.includes("credit default swap") || q.includes("cds")) {
      return `📈 **Credit Default Swaps (CDS)**

**What It Is:**
A financial contract that acts like insurance against loan defaults.

**How It Works:**
• Buyer pays premiums to seller
• If borrower defaults, seller pays buyer
• Allows risk transfer without owning debt
• Used for hedging or speculation

**Key Risks:**
• Counterparty risk
• Market volatility
• Complex hidden risks

**2008 Crisis:**
CDS played a major role when AIG couldn't cover massive payouts.

*Sources: SEC, Federal Reserve, FINRA*`
    }

    if (q.includes("banking") || q.includes("security") || q.includes("online")) {
      return `🔒 **Online Banking Security**

**Strong Authentication:**
• Unique passwords for banking
• Enable two-factor authentication
• Use biometric login when available

**Safe Habits:**
• Always use official bank website
• Never bank on public Wi-Fi
• Log out completely when done
• Check accounts regularly

**Device Security:**
• Keep devices updated
• Use antivirus software
• Don't use shared computers

**Red Flags:**
• Unexpected lockouts
• Unfamiliar transactions
• Verification emails
• Pop-ups asking for info

*Sources: FDIC, CISA, American Bankers Association*`
    }

    // General financial response
    return `💼 **Financial Guidance**

Thank you for your question: "${question}"

**I can help with:**
• Banking terms and concepts
• Loan types and credit
• Investment basics
• Fraud protection
• Financial planning
• Insurance concepts

**Important:** This is educational information only. Always consult licensed financial advisors for personalized advice.

**Ask me about:** Specific financial topics for detailed guidance.

*Sources: CFPB, Financial Industry Best Practices*`
  }

  // Attempt to stream the AI response into the placeholder bot message
  const streamAIResponse = async (question: string, botMessageId: string): Promise<boolean> => {
    if (!(puterStatus === "ready" && window.puter?.ai)) return false

    try {
      const res: any = await window.puter.ai.chat(
        `You are FinBot, a professional financial assistant specializing in banking, investments, loans, and financial security.\n\nProvide a comprehensive, detailed response to the user's question. Structure your answer with clear sections and use bullet points for easy reading. Include:\n- Detailed explanations of concepts\n- Practical examples when relevant\n- Important warnings or considerations\n- Actionable advice\n- Sources or references when appropriate\n\nBe thorough but accessible. Use professional language that's easy to understand.\n\nQuestion: ${question}`,
        {
          model: "gpt-4o-mini",
          max_tokens: 1200,
          temperature: 0.7,
          stream: true,
        }
      )

      // Case 1: Async iterable (token stream)
      if (res && typeof res === "object" && Symbol.asyncIterator in res) {
        for await (const part of res as AsyncIterable<any>) {
          const text = typeof part === "string" ? part : (part?.text ?? "")
          if (!text) continue
          setMessages((prev) => prev.map((m) => (m.id === botMessageId ? { ...m, content: m.content + text } : m)))
        }
        return true
      }

      // Case 2: ReadableStream-like
      if (res?.stream?.getReader) {
        const reader = res.stream.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value, { stream: true })
          if (!text) continue
          setMessages((prev) => prev.map((m) => (m.id === botMessageId ? { ...m, content: m.content + text } : m)))
        }
        return true
      }

      // Case 3: Event emitter style
      if (typeof res?.on === "function") {
        await new Promise<void>((resolve) => {
          res.on("data", (part: any) => {
            const text = typeof part === "string" ? part : (part?.text ?? "")
            if (!text) return
            setMessages((prev) => prev.map((m) => (m.id === botMessageId ? { ...m, content: m.content + text } : m)))
          })
          res.on("end", () => resolve())
          res.on("close", () => resolve())
        })
        return true
      }
    } catch (e) {
      console.log("Streaming failed, will fallback to non-stream:", e)
    }
    return false
  }

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setIsLoading(true)

    try {
      // Add placeholder bot message for streaming
      const botId = (Date.now() + 1).toString()
      const placeholder: Message = {
        id: botId,
        content: "",
        sender: "bot",
        timestamp: new Date(),
        sources: puterStatus === "ready" ? ["Puter AI", "FinBot"] : ["FinBot Knowledge Base"],
      }
      setMessages((prev) => [...prev, placeholder])

      const didStream = await streamAIResponse(currentInput, botId)
      if (!didStream) {
        const response = await getAIResponse(currentInput)
        setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, content: response } : m)))
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I apologize for the technical difficulty. Please try asking your question again.

**Your question:** "${currentInput}"

I'm here to help with banking, investments, loans, and security questions.`,
        sender: "bot",
        timestamp: new Date(),
        sources: ["Error Handler"],
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickQuestions = [
    "What is a phishing scam and how can I protect myself?",
    "Explain credit default swaps in simple terms",
    "How can I secure my online banking?",
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FinBot</h1>
                <p className="text-sm text-gray-600">AI Financial Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={puterStatus === "ready" ? "default" : puterStatus === "loading" ? "secondary" : "destructive"}
                className="text-xs"
              >
                {puterStatus === "ready" ? "AI Ready" : puterStatus === "loading" ? "Loading..." : "Offline Mode"}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClearConfirm(true)}
                className="text-xs"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Clear Chat
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 w-full flex-1 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setInput(quickQuestions[0])}
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div>
                <h3 className="font-semibold">Security</h3>
                <p className="text-sm text-gray-600">Fraud Protection</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setInput(quickQuestions[1])}
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="font-semibold">Investments</h3>
                <p className="text-sm text-gray-600">Financial Products</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setInput(quickQuestions[2])}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="font-semibold">Banking</h3>
                <p className="text-sm text-gray-600">Online Security</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="shadow-lg flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-[300px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.sender === "bot" && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                )}

                <div className={`max-w-[80%] ${message.sender === "user" ? "order-first" : ""}`}>
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      message.sender === "user" ? "bg-blue-600 text-white ml-auto" : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
                    {message.sources && (
                      <div className="flex gap-1">
                        {message.sources.map((source, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {message.sender === "user" && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-3 sm:p-4 sticky bottom-0 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about banking, investments, loans, or security..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Secure financial guidance. Consult licensed professionals for personalized advice.
            </p>
          </div>
        </Card>
      </main>

      {/* Clear Chat Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Clear Chat History</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to clear all chat history? This will remove all previous conversations and start fresh.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={clearChatHistory}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear History
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
