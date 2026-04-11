// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64 } = await req.json()

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            },
            {
              type: 'text',
              text: `이 피부 사진을 분석하고 아래 JSON 형식으로만 응답해. 다른 텍스트 없이 JSON만:
{
  "overallScore": 0-100 숫자,
  "skinCondition": "전반적인 피부 상태 한 줄 설명",
  "acneType": "여드름 타입 (화농성/좁쌀/없음 등)",
  "severity": 1-5 숫자,
  "zones": {
    "forehead": 1-5,
    "leftCheek": 1-5,
    "rightCheek": 1-5,
    "nose": 1-5,
    "chin": 1-5
  },
  "keyFindings": ["발견 1", "발견 2", "발견 3"],
  "recommendations": ["추천 1", "추천 2", "추천 3"]
}`
            }
          ]
        }]
      })
    })

    const data = await openaiRes.json()
    const content = data.choices[0].message.content
    const clean = content.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})