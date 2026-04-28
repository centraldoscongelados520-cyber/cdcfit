export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

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
        max_tokens: 400,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imagem } },
            { type: 'text', text: `Analise esta foto de bandeja de marmitas CDC Fit. Foto tirada de CIMA. Embalagens pretas em GRADE com tampa transparente e etiqueta branca CDC Fit no centro. Conte cada embalagem individual visivel. Identifique o prato pelo conteudo.\n\nPratos:\n${descricoes}\n\nResponda APENAS JSON:\n{"pratos":[{"numero":"XX","quantidade":N}]}` }
          ]
        }]
      })
    });
    const data = await resp.json();
    const txt = data.content?.find(c => c.type === 'text')?.text || '';
    const parsed = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.status(200).json(parsed);
  } catch (e) {
    console.error('Erro:', e.message);
    res.status(500).json({ pratos: [] });
  }
}
