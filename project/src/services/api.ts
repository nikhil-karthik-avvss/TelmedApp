import { ProcessingResult } from '../types/telemedicine';
import { RawMetrics } from '../utils/signalProcessing';

const API_BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const API_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export class TelemedicineAPI {
  private static instance: TelemedicineAPI;

  private constructor() {}

  static getInstance(): TelemedicineAPI {
    if (!TelemedicineAPI.instance) {
      TelemedicineAPI.instance = new TelemedicineAPI();
    }
    return TelemedicineAPI.instance;
  }

  async processSignal(metrics: RawMetrics): Promise<ProcessingResult> {
    const apiUrl = `${API_BASE_URL}/functions/v1/process-signal`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result: ProcessingResult = await response.json();
      return result;
    } catch (error) {
      console.error('Failed to process signal:', error);
      throw error;
    }
  }
}
