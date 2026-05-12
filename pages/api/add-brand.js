export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const TOKEN = process.env.NOTION_TOKEN;
  const SUGGESTIONS_DB = 'edb27959-8f75-4637-aa08-71d4bb2ecf7c';
  const { brand, sector, reason } = req.body;
  if (!brand) return res.status(400).json({ error: 'Nom requis' });

  try {
    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parent: { database_id: SUGGESTIONS_DB },
        properties: {
          Marque: { title: [{ text: { content: brand } }] },
          Secteur: { rich_text: [{ text: { content: sector || '' } }] },
          Pourquoi: { rich_text: [{ text: { content: reason || '' } }] },
          Statut: { select: { name: 'À traiter' } },
        },
      }),
    });
    const data = await response.json();
    if (data.object === 'error') throw new Error(data.message);
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
