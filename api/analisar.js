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
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: tipo || 'image/jpeg', data: imagem } },
            { type: 'text', text: `Você lê notas fiscais brasileiras em papel ou XML.
Extraia as informações e responda APENAS com JSON válido:
{
  "fornecedor": "nome do fornecedor",
  "cnpj": "XX.XXX.XXX/XXXX-XX",
  "data": "DD/MM/AAAA",
  "numero_nf": "número da nota",
  "itens": [
    {
      "descricao": "nome do produto",
      "quantidade": N,
      "unidade": "KG ou UN ou CX etc",
      "valor_unitario": N.NN,
      "valor_total": N.NN
    }
  ],
  "valor_total": N.NN
}
Se não conseguir ler algum campo deixe como null.
Se não conseguir ler nenhum item retorne itens como array vazio.` }
          ]
        }]
      })
    });
    const data = await resp.json();
    const txt = data.content?.find(c => c.type === 'text')?.text || '';
    const parsed = JSON.parse(txt.replace(/```json|```/g, '').trim());
    res.status(200).json(parsed);
  } catch (e) {
    console.error('Erro NF:', e.message);
    res.status(500).json({ error: 'Erro ao ler nota fiscal', itens: [] });
  }
}
 
