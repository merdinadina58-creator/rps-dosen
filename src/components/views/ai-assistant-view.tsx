'use client'

import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Send, Sparkles, User, Loader2, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { useAppStore } from '@/lib/store'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Apa itu CPMK?',
  'Bagaimana menyusun Sub-CPMK yang baik?',
  'Standar bobot penilaian UTS/UAS?',
  'Apa perbedaan MBKM dan KKNI?',
  'Bagaimana cara menyusun CPL yang baik?',
  'Metode pembelajaran yang efektif untuk kuliah 4 SKS?',
]

export function AiAssistantView() {
  const { assistantContextRpsId, setAssistantContextRpsId, setView, openRps } = useAppStore()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Halo! 👋 Saya asisten AI untuk membantu Anda menyusun RPS. Saya bisa menjelaskan konsep CPMK, Sub-CPMK, asesmen, metode pembelajaran, dan standar SN-Dikti/KKNI/MBKM. Apa yang ingin Anda tanyakan?',
    },
  ])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: rpsList = [] } = useQuery({
    queryKey: ['rps', 'list'],
    queryFn: () => api.listRps(),
  })

  const { data: contextRps, isLoading: loadingContext } = useQuery({
    queryKey: ['rps', assistantContextRpsId],
    queryFn: () => (assistantContextRpsId ? api.getRps(assistantContextRpsId) : null),
    enabled: !!assistantContextRpsId,
  })

  const askMut = useMutation({
    mutationFn: ({ question, context }: { question: string; context?: string }) =>
      api.askAssistant(question, context),
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }])
    },
    onError: (e: Error) => {
      toast.error(e.message)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Maaf, terjadi kesalahan: ${e.message}. Silakan coba lagi.`,
        },
      ])
    },
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, askMut.isPending])

  const buildContext = (): string | undefined => {
    if (!contextRps) return undefined
    return [
      `RPS: ${contextRps.judul}`,
      `Mata Kuliah: ${contextRps.mataKuliah.nama} (${contextRps.mataKuliah.kode}), ${contextRps.mataKuliah.sks} SKS`,
      `Prodi: ${contextRps.mataKuliah.prodi}`,
      `Deskripsi: ${contextRps.deskripsi || contextRps.mataKuliah.deskripsi}`,
      `CPL: ${contextRps.cpl || '-'}`,
      `Status: ${contextRps.status}, Kurikulum: ${contextRps.kurikulum}`,
      `CPMK (${contextRps.cpmk.length}):`,
      ...contextRps.cpmk.map((c) => `- ${c.kode}: ${c.deskripsi}`),
      `Komponen Penilaian: ${contextRps.penilaian
        .map((p) => `${p.nama} (${p.bobot}%)`)
        .join(', ')}`,
    ].join('\n')
  }

  const handleSend = (text?: string) => {
    const question = (text ?? input).trim()
    if (!question || askMut.isPending) return
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setInput('')
    askMut.mutate({ question, context: buildContext() })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="size-6 text-primary" />
          AI Assistant
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Asisten cerdas untuk membantu menyusun dan memahami RPS
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Chat panel */}
        <Card className="flex flex-col h-[70vh]">
          <CardContent className="flex flex-col flex-1 p-0 overflow-hidden">
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <User className="size-4" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                  </div>
                  <div
                    className={`flex-1 min-w-0 ${
                      msg.role === 'user' ? 'flex justify-end' : ''
                    }`}
                  >
                    <div
                      className={`inline-block rounded-xl px-4 py-2.5 text-sm max-w-[90%] ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose-rps">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {askMut.isPending && (
                <div className="flex gap-3">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Sparkles className="size-4" />
                  </div>
                  <div className="bg-muted rounded-xl px-4 py-3 flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">AI sedang menjawab...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Suggestion chips */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleSend(s)}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t p-3 flex gap-2 items-end">
              <Textarea
                placeholder="Ketik pertanyaan Anda... (Enter untuk kirim, Shift+Enter untuk baris baru)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="min-h-10 max-h-32 resize-none"
                disabled={askMut.isPending}
              />
              <Button
                onClick={() => handleSend()}
                disabled={askMut.isPending || !input.trim()}
                size="icon"
                className="bg-primary hover:bg-primary/90 h-10 w-10 shrink-0"
                aria-label="Kirim"
              >
                {askMut.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Context panel */}
        <Card className="h-fit">
          <CardContent className="p-4 space-y-3">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="size-4" /> Konteks RPS
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilih RPS untuk memberi konteks ke AI
              </p>
            </div>

            <Select
              value={assistantContextRpsId ?? 'none'}
              onValueChange={(v) => setAssistantContextRpsId(v === 'none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih RPS (opsional)" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="none">Tanpa konteks</SelectItem>
                {rpsList.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.judul.length > 50 ? r.judul.slice(0, 50) + '...' : r.judul}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {assistantContextRpsId && (
              loadingContext ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : contextRps ? (
                <div className="rounded-lg border p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {contextRps.mataKuliah.kode}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        contextRps.status === 'final'
                          ? 'text-emerald-600'
                          : contextRps.status === 'draft'
                          ? 'text-amber-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {contextRps.status}
                    </Badge>
                  </div>
                  <p className="font-medium">{contextRps.mataKuliah.nama}</p>
                  <p className="text-muted-foreground">
                    {contextRps.mataKuliah.sks} SKS · {contextRps.mataKuliah.prodi}
                  </p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    <Badge variant="outline" className="text-[10px]">
                      {contextRps.cpmk.length} CPMK
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {contextRps.pertemuan.length} Pertemuan
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs mt-1"
                    onClick={() => {
                      openRps(contextRps.id)
                      setView('rps-detail')
                    }}
                  >
                    Buka RPS →
                  </Button>
                </div>
              ) : null
            )}

            <div className="rounded-lg bg-muted/50 p-3 text-xs">
              <p className="font-medium mb-1">💡 Tips</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Pilih RPS untuk konteks spesifik</li>
                <li>• Tanya tentang CPMK, Sub-CPMK, asesmen</li>
                <li>• Minta contoh atau template</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
