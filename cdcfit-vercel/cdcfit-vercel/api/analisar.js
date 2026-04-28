export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { imagem, tipo, descricoes } = req.body;
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: tipo, data: imagem } },
            { type: 'text', text: `Você analisa fotos de bandejas de produção da CDC Fit (marmitas ultracongeladas).

COMO SÃO AS FOTOS:
- Foto tirada de CIMA para BAIXO
- Embalagens pretas retangulares em GRADE (fileiras e colunas)
- Tampa transparente em cada embalagem
- Etiqueta branca CDC Fit no centro de cada embalagem
- Fundo de bandeja branca ou cinza

TAREFA 1 — CONTAR:
Conte CADA embalagem individual visível na grade.
Exemplos: 2 colunas x 4 fileiras = 8. 2 colunas x 3 fileiras = 6.
Seja preciso — conte cada retângulo preto individual.

TAREFA 2 — IDENTIFICAR:
Olhe através da tampa transparente para ver o conteúdo.
Use as descrições abaixo:
${descricoes}

REGRAS:
- Tipos diferentes na mesma bandeja: liste separado com quantidade de cada
- Ravioli sem distinguir carne/queijo: use numero "RAVIOLI"
- Não identificou: use numero "?"

Responda APENAS com JSON válido:
{"pratos":[{"numero":"XX","quantidade":N}]}` }
          ]
        }]
      })
    });
    const data = await resp.json();
    const txt = data.content?.find(c => c.type === 'text')?.text || '';
    const parsed = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.status(200).json(parsed);
  } catch (e) {
    res.status(500).json({ error: 'Erro na análise', pratos: [] });
  }
}
