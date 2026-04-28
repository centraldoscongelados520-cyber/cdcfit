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
            { type: 'text', text: `Você analisa fotos de bandejas de produção da CDC Fit.\n\nCOMO SÃO AS FOTOS:\n- Foto tirada de CIMA para BAIXO\n- Embalagens pretas em GRADE\n- Tampa transparente\n- Etiqueta branca CDC Fit no centro\n\nConte CADA embalagem visível.\nIdentifique o prato pelo conteúdo.\n\nDescricoes:\n${descricoes}\n\nResponda APENAS com JSON:\n{"pratos":[{"numero":"XX","quantidade":N}]}` }
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
