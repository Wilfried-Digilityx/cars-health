import Anthropic from 'npm:@anthropic-ai/sdk'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type InterventionType = 'intervention' | 'ct' | 'other'

const BASE_RULES = `
Règles :
- Réponds UNIQUEMENT avec un objet JSON valide, sans texte avant ou après
- Mets null pour toute information absente du document
- "cost" : montant total TTC final facturé (nombre décimal ou null)
- "mileage" : kilométrage indiqué sur le document (entier ou null)
- "date" : format YYYY-MM-DD (ou null si absente)
- "title" : intitulé court et précis en français`

function buildPrompt(type: InterventionType): string {
  switch (type) {

    case 'intervention':
      return `Tu analyses une facture ou un bon d'intervention automobile (entretien, réparation, remplacement de pièces, carrosserie, électronique, etc.).
Extrais les informations et réponds avec ce JSON :

{
  "title": "Vidange + remplacement plaquettes avant",
  "date": "2024-03-15",
  "mileage": 87500,
  "cost": 320.00,
  "garage": "Garage Dupont",
  "technician": null,
  "description": "Vidange huile 5W40 Castrol 4.5L, filtre à huile Bosch. Remplacement plaquettes avant TRW. Vérification niveaux.",
  "tags": ["vidange", "freinage"],
  "parts": [
    {"name": "Filtre à huile", "lineType": "part", "brand": "Bosch", "reference": "F026407123", "vat": 20, "price": 12.50, "priceTtc": 15.00},
    {"name": "Huile moteur 5W40 4.5L", "lineType": "fluid", "brand": "Castrol", "reference": null, "vat": 20, "price": 23.33, "priceTtc": 28.00},
    {"name": "Main d'oeuvre vidange", "lineType": "labor", "brand": null, "reference": null, "vat": 20, "price": 29.17, "priceTtc": 35.00},
    {"name": "Plaquettes avant", "lineType": "part", "brand": "TRW", "reference": null, "vat": 20, "price": 45.00, "priceTtc": 54.00},
    {"name": "Main d'oeuvre freinage", "lineType": "labor", "brand": null, "reference": null, "vat": 20, "price": 50.00, "priceTtc": 60.00}
  ]
}
${BASE_RULES}
- "tags" : liste des tags thématiques correspondant aux opérations effectuées. Choisis parmi ces valeurs uniquement :
  * "vidange" — vidange huile moteur, filtre à huile
  * "pneumatiques" — pneus, montage, équilibrage, permutation
  * "freinage" — plaquettes, disques, liquide de frein
  * "revision" — révision périodique, entretien général, filtres (air, habitacle, carburant), bougies
  * "reparation" — panne, diagnostic, réparation mécanique
  * "carrosserie" — choc, rayure, peinture, débosselage, rouille
  * "electrique" — batterie, calculateur, capteurs, codes défaut OBD, électronique
  * "piece" — remplacement d'une pièce mécanique usée ou cassée (hors catégories ci-dessus)
  Tu peux mettre plusieurs tags si l'intervention couvre plusieurs domaines.
- "description" : résumé de toutes les opérations effectuées (fluides, références huile, codes défaut OBD si présents, zone carrosserie si pertinent…)
- "parts" : liste de TOUTES les lignes de facturation présentes dans le document (pièces, main d'œuvre, fluides, etc.)
  - "lineType" : "part" (pièce mécanique), "labor" (main d'œuvre, pose, opération, forfait MO), "fluid" (huile moteur, liquide de frein, liquide de refroidissement, graisse), "other" (autre)
  - "vat" : taux de TVA en % de cette ligne (ex: 20). Utilise 20 par défaut si non précisé sur la facture.
  - ÉTAPE 1 — Détermine si les prix affichés sur la facture sont HT ou TTC :
    * Cherche les en-têtes de colonnes : "Prix HT", "P.U. HT", "Prix TTC", "P.U. TTC"
    * Cherche les totaux en bas : si la facture montre "Total HT : X €" puis "TVA : Y €" puis "Total TTC : Z €", les prix des lignes sont EN HT
    * Si tu vois un seul total sans ligne TVA séparée, ou la mention "TTC", les prix sont probablement EN TTC
    * Sur une facture française standard de garage, les prix unitaires sont généralement affichés HT
  - ÉTAPE 2 — Pour chaque ligne, en fonction du résultat de l'étape 1 :
    * Prix affichés EN HT  → "price" = montant affiché, "priceTtc" = price × (1 + vat/100)
    * Prix affichés EN TTC → "priceTtc" = montant affiché, "price" = priceTtc / (1 + vat/100)
  - Fournis TOUJOURS les deux valeurs "price" (HT) et "priceTtc" (TTC) pour chaque ligne.
  - IMPORTANT : extrait TOUJOURS les lignes de main d'œuvre si elles apparaissent sur la facture
  - liste vide si aucune ligne de détail dans le document`

    case 'ct':
      return `Tu analyses un procès-verbal de contrôle technique automobile.
Extrais les informations et réponds avec ce JSON :

{
  "title": "Contrôle technique",
  "date": "2024-05-03",
  "mileage": 95000,
  "cost": 79.00,
  "garage": "Autovision Paris 15",
  "technician": null,
  "description": "Défaillance mineure : usure pneu arrière gauche",
  "metadata": {
    "result": "favorable_minor",
    "counterVisitRequired": false,
    "counterVisitDeadline": null,
    "nextCtDate": "2026-05-03",
    "reportNumber": "CT-2024-087654"
  }
}
${BASE_RULES}
- "result" : "favorable" (aucune défaillance ou mineures seulement sans contre-visite), "favorable_minor" (défaillances mineures), "unfavorable" (contre-visite obligatoire)
- "counterVisitRequired" : true si contre-visite obligatoire, false sinon
- "counterVisitDeadline" : date limite de contre-visite (YYYY-MM-DD) ou null
- "nextCtDate" : date du prochain contrôle technique (YYYY-MM-DD) ou null
- "reportNumber" : numéro du procès-verbal ou null
- "description" : liste des défaillances éventuelles en français ou null`

    case 'other':
    default:
      return `Tu analyses un document lié à un véhicule automobile.
Extrais les informations et réponds avec ce JSON :

{
  "title": "Opération véhicule",
  "date": "2024-09-01",
  "mileage": 75000,
  "cost": 120.00,
  "garage": "Garage Leblanc",
  "technician": null,
  "description": "Description de l'opération effectuée",
  "parts": []
}
${BASE_RULES}
- "description" : description de l'opération effectuée
- "parts" : pièces remplacées si mentionnées (liste vide sinon)`
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json() as {
      fileBase64: string
      mediaType: string
      interventionType?: InterventionType
    }
    const { fileBase64, mediaType, interventionType = 'other' } = body

    const client = new Anthropic()

    const isImage = mediaType.startsWith('image/')
    const isPdf = mediaType === 'application/pdf'

    if (!isImage && !isPdf) {
      return new Response(
        JSON.stringify({ error: 'Type de fichier non supporté (JPG, PNG, WEBP ou PDF uniquement)' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contentBlock: any = isImage
      ? { type: 'image', source: { type: 'base64', media_type: mediaType, data: fileBase64 } }
      : { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileBase64 } }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [contentBlock, { type: 'text', text: buildPrompt(interventionType) }],
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text : ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) {
      return new Response(
        JSON.stringify({ error: `Impossible d'extraire les données du document. Réponse brute : ${raw.slice(0, 200)}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const extracted = JSON.parse(match[0])

    return new Response(JSON.stringify(extracted), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyErr = err as any
    const detail = anyErr?.status
      ? `Erreur API Claude (${anyErr.status}) : ${anyErr.message ?? 'inconnue'}`
      : err instanceof Error ? err.message : 'Erreur inconnue'
    return new Response(
      JSON.stringify({ error: detail }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
