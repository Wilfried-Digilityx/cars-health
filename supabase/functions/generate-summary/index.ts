import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FUEL_LABELS: Record<string, string> = {
  gasoline: 'Essence', diesel: 'Diesel', electric: 'Électrique', hybrid: 'Hybride', lpg: 'GPL',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { vehicle, interventions } = await req.json()

    // Build a readable text representation of the vehicle and its history
    const vehicleText = [
      `Marque / Modèle : ${vehicle.make} ${vehicle.model} (${vehicle.year})`,
      `Immatriculation : ${vehicle.licensePlate}`,
      `Kilométrage actuel : ${vehicle.mileage.toLocaleString('fr-FR')} km`,
      `Carburant : ${FUEL_LABELS[vehicle.fuelType] ?? vehicle.fuelType}`,
      vehicle.color     ? `Couleur : ${vehicle.color}` : null,
      vehicle.purchaseDate ? `Date d'achat : ${vehicle.purchaseDate}` : null,
      vehicle.vin       ? `VIN : ${vehicle.vin}` : null,
      vehicle.notes     ? `Notes propriétaire : ${vehicle.notes}` : null,
    ].filter(Boolean).join('\n')

    const totalCost = interventions.reduce((s: number, i: { cost?: number }) => s + (i.cost ?? 0), 0)

    const interventionsText = interventions.length === 0
      ? 'Aucune intervention enregistrée.'
      : interventions.map((i: {
          date: string; mileage: number; title: string; type: string;
          description?: string; cost?: number; garage?: string;
          parts?: { name: string; brand?: string; price?: number }[];
          metadata?: Record<string, unknown>;
        }) => {
          const lines = [
            `• [${i.date}] ${i.title} — ${i.mileage.toLocaleString('fr-FR')} km`,
            i.garage      ? `  Garage : ${i.garage}` : null,
            i.cost != null ? `  Coût : ${i.cost.toFixed(2)} €` : null,
            i.description ? `  Détail : ${i.description}` : null,
            i.parts && i.parts.length > 0
              ? `  Pièces : ${i.parts.map((p) => `${p.name}${p.brand ? ` (${p.brand})` : ''}${p.price != null ? ` — ${p.price.toFixed(2)} €` : ''}`).join(', ')}`
              : null,
            i.metadata && i.type === 'ct'
              ? `  CT : ${(i.metadata as { result?: string }).result === 'favorable' ? 'Favorable' : (i.metadata as { result?: string }).result === 'favorable_minor' ? 'Favorable avec défaillances mineures' : 'Défavorable'}`
              : null,
          ]
          return lines.filter(Boolean).join('\n')
        }).join('\n\n')

    const prompt = `Tu es un expert automobile chargé d'analyser l'historique complet d'un véhicule et de rédiger une synthèse claire et utile pour son propriétaire.

Voici les informations du véhicule :
${vehicleText}

Coût total des interventions enregistrées : ${totalCost.toFixed(2)} €

Historique des interventions (${interventions.length} au total, du plus récent au plus ancien) :
${interventionsText}

Rédige une synthèse structurée en JSON avec exactement ce format :

{
  "health": "excellent|good|fair|poor",
  "healthLabel": "Très bon état|Bon état|État correct|État préoccupant",
  "overview": "Paragraphe de 3 à 5 phrases résumant l'état général du véhicule, son entretien global et son historique notable.",
  "highlights": [
    "Point fort ou fait notable 1",
    "Point fort ou fait notable 2"
  ],
  "costAnalysis": "1 à 2 phrases sur les coûts : total dépensé, coût moyen par intervention, et si cela semble dans la norme pour ce type de véhicule.",
  "recommendations": [
    "Recommandation ou point de vigilance 1",
    "Recommandation ou point de vigilance 2"
  ],
  "buyerNote": "Si ce véhicule était mis en vente, 1 à 2 phrases résumant ce qu'un acheteur potentiel doit savoir sur son état et son historique."
}

Règles :
- Réponds UNIQUEMENT avec le JSON, sans texte avant ou après
- "highlights" : entre 2 et 5 points (entretien régulier, absence de grosses pannes, remplacement récent d'une pièce importante, CT favorable, etc.)
- "recommendations" : entre 1 et 4 points (entretiens à prévoir, points de vigilance, kilométrage élevé, etc.) — si le véhicule est en parfait état, 1 seul point suffit
- Sois factuel et concis, évite le jargon inutile
- Si l'historique est vide ou insuffisant, indique-le clairement dans l'overview`

    const client = new Anthropic()
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Réponse Claude invalide')

    return new Response(match[0], {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
