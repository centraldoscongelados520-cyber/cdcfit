export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };
 
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { imagem, tipo } = req.body;
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: tipo || 'image/jpeg', data: imagem } },
            { type: 'text', text: `Conte quantas embalagens de marmita existem nesta foto.
A foto mostra uma bandeja vista de CIMA com embalagens pretas retangulares dispostas em grade (fileiras e colunas).
Cada embalagem tem uma tampa transparente com etiqueta branca no centro.
Conte cada embalagem individual.
Exemplos: 2 colunas x 4 linhas = 8. 2 colunas x 3 linhas = 6.
Responda APENAS com JSON: {"quantidade": N}` }
          ]
        }]
      })
    });
    const data = await resp.json();
    const txt = data.content?.find(c => c.type === 'text')?.text || '';
    const parsed = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.status(200).json({ quantidade: parsed.quantidade || 0 });
  } catch (e) {
    console.error('Erro:', e.message);
    res.status(500).json({ quantidade: 0 });
  }
}
