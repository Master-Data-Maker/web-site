import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de requêtes, réessaie dans 15 minutes.' },
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.static(path.join(__dirname, '../public')));

app.post('/api/coach', limiter, async (req, res) => {
  const { summary } = req.body;
  if (!summary || typeof summary !== 'string' || summary.length > 500) {
    return res.status(400).json({ error: 'Données invalides.' });
  }
  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system:
        'Tu es un coach financier bienveillant et pragmatique. Analyse les données de budget et donne 3-4 conseils concrets, personnalisés et bienveillants. Sois direct et positif. Réponds en français, en texte simple sans markdown.',
      messages: [
        {
          role: 'user',
          content: `Voici mon résumé financier du mois : ${summary} Donne-moi tes conseils personnalisés.`,
        },
      ],
    });
    res.json({ text: message.content[0].text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la génération des conseils.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MonBudget running on http://localhost:${PORT}`));
