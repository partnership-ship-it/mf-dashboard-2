export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const TOKEN = process.env.NOTION_TOKEN;
  const DB_ID = process.env.NOTION_DATABASE_ID;

  async function queryAll() {
    const contacts = [];
    const seen = new Set();
    let cursor = undefined;
    let hasMore = true;

    while (hasMore) {
      const body = {
        filter: {
          or: [
            { property: 'Statut', select: { equals: 'Email envoyé' } },
            { property: 'Statut', select: { equals: 'Relance J+5' } },
            { property: 'Statut', select: { equals: 'Relance J+10' } },
            { property: 'Statut', select: { equals: 'Répondu' } },
            { property: 'Statut', select: { equals: 'Client' } },
            { property: 'Statut', select: { equals: 'Pas intéressé' } },
            { property: 'Statut', select: { equals: 'À contacter' } },
          ]
        },
        sorts: [{ property: 'Date dernier statut', direction: 'descending' }],
        page_size: 100,
      };
      if (cursor) body.start_cursor = cursor;

      const response = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      for (const page of data.results || []) {
        const p = page.properties;
        const entreprise = p.Entreprise?.title?.[0]?.plain_text || '';
        const statut = p.Statut?.select?.name || '';
        const nom = p['Nom Prénom']?.rich_text?.[0]?.plain_text || '—';
        const date = p['Date dernier statut']?.date?.start || p['Date premier mail']?.date?.start || '';
        const resume = p['Résumé situation']?.rich_text?.[0]?.plain_text || '';
        const action = p['Action à faire']?.select?.name || '';
        const score = p['Score conversion']?.select?.name || '';

        const key = `${entreprise}-${nom}`;
        if (seen.has(key)) continue;
        seen.add(key);

        contacts.push({
          id: page.id,
          entreprise,
          statut,
          nom,
          date: date ? date.slice(0, 10) : '',
          resume,
          action,
          score,
        });
      }

      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    return contacts;
  }

  try {
    const contacts = await queryAll();
    res.status(200).json({ contacts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
