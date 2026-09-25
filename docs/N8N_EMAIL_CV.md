# Flujo n8n: CV recibido por Gmail

El flujo de correo puede usar el mismo análisis de IA que el webhook de RHIA. En esta rama no hay `requestId` previo: n8n crea el candidato al enviar el resultado, utilizando el ID estable del mensaje de Gmail para evitar duplicados.

## URLs que debes configurar en n8n

Sustituye `<API_PUBLIC_URL>` por el dominio HTTPS real de la API y `<companySlug>` por el identificador de la empresa en RHIA. Ese identificador se ve en el portal administrador y en los enlaces públicos `/postular/<companySlug>/...`. La API debe estar publicada para que n8n Cloud pueda llamarla; `localhost` no sirve desde n8n Cloud.

**Obtener vacante** — método `GET`:

```text
<API_PUBLIC_URL>/api/v1/integrations/n8n/email/companies/<companySlug>/vacancies?title=<nombre-de-vacante-codificado>
```

Header: `x-rhia-workflow-token: <N8N_OUTBOUND_TOKEN>`.

El valor de `title` sale del asunto `{nombre} - {vacante}` y debe codificarse como parámetro de URL. El endpoint busca un título **exacto**, sin distinguir mayúsculas, sólo entre las plazas publicadas de esa empresa. Responde `404` si no existe y `409` si hay dos plazas publicadas con el mismo título. No usa una búsqueda parcial ni devuelve plazas de otras empresas.

Respuesta exitosa:

```json
{
  "data": {
    "vacancyId": "507f1f77bcf86cd799439011",
    "vacancy": {
      "title": "Analista de Recursos Humanos",
      "department": "Recursos Humanos",
      "location": "Guatemala",
      "workType": "full_time",
      "description": "Responsabilidades de la plaza",
      "requirements": ["Reclutamiento", "Excel"]
    }
  }
}
```

**Enviar resultado (correo)** — método `POST`, URL fija:

```text
<API_PUBLIC_URL>/api/v1/integrations/n8n/email/companies/<companySlug>/cv-analysis
```

Headers: `Content-Type: application/json` y `x-n8n-callback-secret: <N8N_CALLBACK_SECRET>`.

Body JSON:

```json
{
  "messageId": "ID-estable-del-mensaje-de-Gmail",
  "vacancyId": "507f1f77bcf86cd799439011",
  "candidate": {
    "name": "Ana Martínez",
    "email": "ana@example.com",
    "cvText": "Texto extraído del PDF del CV..."
  },
  "analysis": {
    "isValidCV": true,
    "securityStatus": "clean",
    "securityFlags": [],
    "confidence": 0.92,
    "score": 84,
    "summary": "Experiencia relevante para la plaza.",
    "strengths": ["Reclutamiento"],
    "gaps": ["No demuestra inglés avanzado"],
    "recommendation": "advance"
  }
}
```

`vacancyId` debe venir de la respuesta de **Obtener vacante**; `messageId` debe ser el ID estable que entrega Gmail, no un ID nuevo generado para cada ejecución. `candidate.name` sale del asunto, `candidate.email` del remitente y `candidate.cvText` del texto extraído del PDF. El resultado de la IA se coloca en `analysis` como objeto JSON. `phone` es opcional. No envíes el archivo binario en este body.

Al crear un candidato responde `201` con `data.candidateId`, `data.status` y `data.duplicate: false`. Si n8n reintenta el mismo `messageId`, responde `200`, `duplicate: true` y el ID ya creado. Si ese mensaje se intenta asignar a otra plaza, responde `409`. Marca el correo como leído sólo después de recibir `200` o `201` del callback. El análisis limpio queda visible entre los candidatos de la plaza.

Si el checkpoint de seguridad detecta prompt injection, documento que no es CV o contenido dudoso, utiliza **la misma URL fija** pero con `analysis` sin puntuación. Por ejemplo:

```json
{
  "messageId": "ID-estable-del-mensaje",
  "vacancyId": "507f1f77bcf86cd799439011",
  "candidate": { "name": "Nombre del asunto", "email": "origen@example.com", "cvText": "Texto extraído del PDF..." },
  "analysis": {
    "isValidCV": false,
    "securityStatus": "prompt_injection_detected",
    "securityFlags": ["Instrucciones dirigidas al modelo"],
    "confidence": 0.9
  }
}
```

La API lo guarda directamente en `quarantinedapplications` y responde `status: "blocked"`. La misma regla aplica a `not_a_cv` y `needs_review`. No ejecutes el análisis de ajuste ni envíes `score` en esta rama.

## Orden de nodos

```text
Gmail → separar nombre y vacante del asunto → validar PDF → extraer texto
      → GET Obtener vacante → IA con la vacante devuelta por la API
      → validar JSON → POST Enviar resultado (correo) → marcar como leído
```

La API comprueba el token o secreto, el estado de la empresa, el plan `cvAnalyzer` y que la plaza siga publicada. La URL y los secretos deben configurarse en n8n; no incluyas secretos en el prompt de la IA ni en el repositorio.
