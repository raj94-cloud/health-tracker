import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { imageBase64, mimeType } = await req.json()

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: 'ಈ ಆಹಾರ/ಊಟದ ಚಿತ್ರವನ್ನು ವಿಶ್ಲೇಷಿಸಿ. ನೀವು ಗುರುತಿಸಬಹುದಾದ ಎಲ್ಲಾ ಆಹಾರ ಪದಾರ್ಥಗಳು, ಪದಾರ್ಥಗಳು ಮತ್ತು ಪ್ರೋಟೀನ್ ಮೂಲಗಳನ್ನು ಪಟ್ಟಿ ಮಾಡಿ. ಎರಡು ಕ್ಷೇತ್ರಗಳೊಂದಿಗೆ JSON ಆಬ್ಜೆಕ್ಟ್ ಹಿಂತಿರುಗಿಸಿ: "items" (ಕನ್ನಡದಲ್ಲಿ ಸಣ್ಣ ಹೆಸರುಗಳ ಅರೇ, ಗರಿಷ್ಠ 8) ಮತ್ತು "summary" (ಕನ್ನಡದಲ್ಲಿ ಒಂದು ವಾಕ್ಯದ ವಿವರಣೆ).'
            },
            { inline_data: { mime_type: mimeType, data: imageBase64 } }
          ]
        }],
        generationConfig: { responseMimeType: 'application/json' }
      })
    }
  )

  const data = await res.json()
  if (data.error) return NextResponse.json({ items: [], summary: JSON.stringify(data.error) })
  try {
    const text = data.candidates[0].content.parts[0].text
    return NextResponse.json(JSON.parse(text))
  } catch {
    return NextResponse.json({ items: [], summary: 'Could not analyse image.' })
  }
}
