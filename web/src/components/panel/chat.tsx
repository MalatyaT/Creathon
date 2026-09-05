"use client";

import { useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { sendMessageAction } from "@/app/panel/soru-sor/actions";
import type { ChatTurn } from "@/lib/gemini-tasks/answer-question";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  imagePreview?: string;
  topicLabel?: string;
  sourceReference?: string;
};

const QUICK_PROMPTS = [
  "Bu soruyu adım adım çözer misin?",
  "Bu konudan bana bir örnek daha ver",
  "Neden bu şık yanlış, açıklar mısın?",
];

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = String(reader.result);
      const base64 = result.slice(result.indexOf(",") + 1);
      resolve({ base64, mimeType: file.type || "image/png" });
    };
    reader.readAsDataURL(file);
  });
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [image, setImage] = useState<{ file: File; previewUrl: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImagePick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImage({ file, previewUrl: URL.createObjectURL(file) });
  }

  async function handleSend() {
    const question = draft.trim();
    if (!question && !image) return;

    setError(null);
    const pendingImage = image;
    setDraft("");
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: question || "(görsel)",
      imagePreview: pendingImage?.previewUrl,
    };
    setMessages((prev) => [...prev, userMessage]);
    setPending(true);

    try {
      const history: ChatTurn[] = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        text: m.text,
      }));

      let imagePayload: { imageBase64?: string; imageMimeType?: string } = {};
      if (pendingImage) {
        const { base64, mimeType } = await fileToBase64(pendingImage.file);
        imagePayload = { imageBase64: base64, imageMimeType: mimeType };
      }

      const answer = await sendMessageAction({
        history,
        question: question || "Bu görseldeki soruyu çöz.",
        ...imagePayload,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: answer.answer,
          topicLabel: answer.topic_label,
          sourceReference: answer.source_reference || undefined,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir şeyler ters gitti");
    } finally {
      setPending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex min-h-[320px] flex-col gap-4 rounded-2xl border border-border bg-surface p-6">
        {messages.length === 0 && (
          <p className="text-sm text-foreground/50">
            Bir soru yaz ya da fotoğrafını yükle — okulda gördüğün yöntemle,
            adım adım anlatılır.
          </p>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl border-l-[3px] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "border-brand-violet bg-surface-muted"
                  : "border-brand-teal bg-background"
              }`}
            >
              <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
                {m.role === "user" ? "Sen" : "İkiz"}
              </div>
              {m.imagePreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={m.imagePreview}
                  alt="Gönderilen soru görseli"
                  className="mb-2 max-h-40 rounded-lg border border-border"
                />
              )}
              {m.text}
              {(m.topicLabel || m.sourceReference) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.topicLabel && (
                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-brand-teal-600">
                      {m.topicLabel}
                    </span>
                  )}
                  {m.sourceReference && (
                    <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-brand-violet">
                      📖 {m.sourceReference}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {pending && <div className="text-xs text-brand-violet">yazıyor…</div>}
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => setDraft(p)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-surface-muted"
          >
            {p}
          </button>
        ))}
      </div>

      {image && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.previewUrl}
            alt="Eklenecek soru görseli"
            className="h-16 w-16 rounded-lg border border-border object-cover"
          />
          <button
            onClick={() => setImage(null)}
            className="text-xs text-foreground/50 hover:text-risk-5"
          >
            görseli kaldır
          </button>
        </div>
      )}

      <div className="flex items-end gap-2.5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImagePick}
          className="hidden"
          id="chat-image-input"
        />
        <label
          htmlFor="chat-image-input"
          className="cursor-pointer rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-surface-muted"
        >
          📷
        </label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Soruyu yaz ya da fotoğrafını yükle…"
          rows={2}
          className="flex-1 resize-none rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-brand-violet"
        />
        <button
          onClick={handleSend}
          disabled={pending || (!draft.trim() && !image)}
          className="h-[42px] rounded-full bg-brand-violet px-5 text-sm font-semibold text-white hover:bg-brand-violet-600 disabled:opacity-60"
        >
          Gönder
        </button>
      </div>

      {error && <p className="text-sm text-risk-5">{error}</p>}

      <p className="text-xs text-foreground/45">
        Gemini API üzerinden yanıtlanır · her yanıt kazanım etiketiyle
        ikizine işlenir
      </p>
    </div>
  );
}
