import { NextRequest, NextResponse } from 'next/server';

interface HeartbeatAnalysisResponse {
  heart_rate: number;
  status: string;
  risk: string;
  confidence: number;
  model_prediction: string;
  recommendation: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'Aucun fichier audio fourni' }, { status: 400 });
    }

    // Créer un FormData pour envoyer au backend Python
    const backendFormData = new FormData();
    backendFormData.append('audio', audioFile);

    // Appel au backend Flask
    const backendResponse = await fetch('http://localhost:5000/api/heartbeat-analysis', {
      method: 'POST',
      body: backendFormData,
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json({ error: errorData.error }, { status: backendResponse.status });
    }

    const result: HeartbeatAnalysisResponse = await backendResponse.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur lors de l\'analyse des battements:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}