import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

/**
 * LaTeX'te `%` bir yorum karakteridir — kaçırılmamış bir `%` KaTeX'te ondan sonraki her şeyi
 * (aynı $...$/$$...$$ bloğu içinde) sessizce yutar. Gemini yüzde soruları üretirken ("%40"
 * gibi) bunu bazen kaçırmayı unutuyor, sonuç olarak "400'ün %40'ı kaçtır?" gibi bir soru
 * "400'ün 'ı kaçtır?" olarak görünüyordu (yüzde değeri tamamen kayboluyordu). Sadece $...$/
 * $$...$$ blokları İÇİNDEKİ kaçırılmamış % işaretlerini onarıyoruz — bloklar dışındaki düz
 * metindeki % işaretlerine dokunmuyoruz.
 */
function escapeBarePercentInMath(text: string): string {
  return text.replace(/\$\$([\s\S]*?)\$\$|\$([^$\n]*?)\$/g, (_match, block, inline) => {
    const content: string = block ?? inline;
    const fixed = content.replace(/(?<!\\)%/g, "\\%");
    return block !== undefined ? `$$${fixed}$$` : `$${fixed}$`;
  });
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-markdown">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {escapeBarePercentInMath(children)}
      </ReactMarkdown>
    </div>
  );
}
