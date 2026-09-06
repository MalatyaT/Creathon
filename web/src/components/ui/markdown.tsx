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
 * Gemini bazen düz cümle içindeki sıradan sayıları/basamak-yer-tutucularını ("8 işçi", "15 günde",
 * "A3B5 sayısı", tek başına "A" gibi — gerçek bir kesir/kök/üs/işlem İÇERMEYEN salt harf+rakam
 * dizileri) gereksiz yere $...$ ile sarmalıyor (bkz. kullanıcı geri bildirimi — bu iki farklı
 * şekilde görüldü: salt sayılar ve harf+rakam karışık basamak gösterimleri). Prompt'lara bunu
 * yapmaması söylendi ama garanti değil — kesin bir güvenlik ağı olarak, İÇİNDE SADECE harf/rakam
 * (hiç \komut, ^, _, +, -, /, =, boşluk vb. YOK) olan $...$ bloklarını sarmalamadan çıkarıyoruz.
 * Gerçek bir LaTeX komutu/operatörü olan hiçbir bloğa dokunmuyoruz.
 */
function unwrapPlainAlphanumericMath(text: string): string {
  return text.replace(/\$([A-Za-z0-9]+(?:[.,][0-9]+)?)\$/g, "$1");
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-markdown">
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {unwrapPlainAlphanumericMath(escapeBarePercentInMath(children))}
      </ReactMarkdown>
    </div>
  );
}
