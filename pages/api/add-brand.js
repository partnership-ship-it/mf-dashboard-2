export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const TOKEN = process.env.NOTION_TOKEN;
  const DB_ID = process.env.NOTION_DATABASE_ID;
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
        parent: { database_id: DB_ID },
        properties: {
          Entreprise: { title: [{ text: { content: brand } }] },
          Statut: { select: { name: 'À contacter' } },
          Notes: { rich_text: [{ text: { content: `Suggéré par Mélissa${sector ? ' — ' + sector : ''}${reason ? ' — ' + reason : ''}` } }] },
          'Prêt à envoyer': { checkbox: false },
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
