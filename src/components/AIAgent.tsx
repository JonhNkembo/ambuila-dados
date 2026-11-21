'use client';
import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Trash2 } from 'lucide-react';
import { generateGroundedAIResponse, type AIContext } from '@/lib/ai';

interface Msg { role: 'user' | 'bot'; html: string }
const SUGGESTIONS = [
  'Quantas escolas existem em Ambuíla?', 'Qual a distribuição das unidades sanitárias?', 'Quais os principais produtos agrícolas?',
  'Resumo demográfico por comuna', 'Que projectos municipais estão registados?', 'Que dados estão desactualizados ou em falta?',
];
const WELCOME: Msg = {
  role: 'bot',
  html: '<div class="fw-bold text-inst-dark mb-1">AMBÚILA AI</div><p class="mb-0">Faça uma pergunta sobre os dados registados. Respondo <strong>exclusivamente</strong> com base na base de dados municipal e, quando a informação não existe, digo-o.</p>',
};

export default function AIAgent({ ctx }: { ctx: AIContext }) {
  const [msgs, setMsgs] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState('');
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight, behavior: 'smooth' }); }, [msgs]);

  function ask(text: string) {
    const t = text.trim();
    if (!t) return;
    const esc = t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
    setMsgs((m) => [...m, { role: 'user', html: esc }, { role: 'bot', html: generateGroundedAIResponse(t, ctx) }]);
    setInput('');
  }

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <div className="inst-card p-3">
          <div className="ai-chat-box" ref={box} aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`ai-msg ${m.role === 'user' ? 'ai-msg-user' : 'ai-msg-bot'}`} dangerouslySetInnerHTML={{ __html: m.html }} />
            ))}
          </div>
          <form className="d-flex gap-2 mt-3" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
            <input className="form-control" placeholder="Escreva a sua pergunta sobre Ambuíla..." value={input} onChange={(e) => setInput(e.target.value)} />
            <button className="btn btn-inst-primary d-flex align-items-center gap-1"><Send size={15} /> Enviar</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setMsgs([WELCOME])} title="Limpar conversa"><Trash2 size={15} /></button>
          </form>
        </div>
      </div>
      <div className="col-lg-4">
        <div className="inst-card p-4">
          <h4 className="h6 fw-bold text-inst-dark mb-3 d-flex align-items-center gap-2"><Bot size={16} /> Perguntas sugeridas</h4>
          <div className="d-flex flex-column gap-2">
            {SUGGESTIONS.map((s) => <button key={s} className="btn btn-sm btn-inst-outline text-start" onClick={() => ask(s)}>{s}</button>)}
          </div>
          <p className="small text-muted mt-3 mb-0">As respostas são calculadas em tempo real a partir dos registos existentes; nada é inventado nem vem de fontes externas.</p>
        </div>
      </div>
    </div>
  );
}
