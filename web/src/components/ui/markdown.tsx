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

/**
 * Gemini bazen düz cümle içindeki sıradan sayıları da ("8 işçi", "15 günde" gibi — kesir/kök/üs
 * içermeyen tek başına bir sayı) gereksiz yere $...$ ile sarmalıyor (bkz. kullanıcı geri bildirimi:
 * "sayıların başında sonunda dolar işareti var"). Prompt'lara bunu yapmaması söylendi ama garanti
 * değil — burada da kesin bir güvenlik ağı olarak, İÇİNDE SADECE tek bir sayı (ondalık/virgüllü
 * olabilir) olan $...$ bloklarını sarmalamadan çıkarıyoruz. Bir LaTeX komutu/operatör içeren
 * bloklara (\sqrt, \frac, ^, vb.) dokunmuyoruz.
 */
function unwrapPlainNumberMath(text: string): string {
  return text.replace(/\$(\d+(?:[.,]\d+)?)\$/g, "$1");
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-markdown">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {unwrapPlainNumberMath(escapeBarePercentInMath(children))}
      </ReactMarkdown>
    </div>
  );
}
