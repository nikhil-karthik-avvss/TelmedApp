import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SignalMetrics {
  averageIntensity?: number;
  redChannel?: number;
  greenChannel?: number;
  blueChannel?: number;
  motionScore?: number;
  timestamp: number;
}

interface ProcessingResult {
  alerts: Array<{
    type: string;
    message: string;
    timestamp: number;
  }>;
  signalQuality: number;
  ppgValue?: number;
  metrics?: {
    illumination: number;
    motion: number;
    fingerPlacement: number;
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { metrics }: { metrics: SignalMetrics } = await req.json();

    const result: ProcessingResult = {
      alerts: [],
      signalQuality: 0,
      metrics: {
        illumination: 0,
        motion: 0,
        fingerPlacement: 0,
      },
    };

    if (metrics.averageIntensity !== undefined) {
      result.metrics.illumination = metrics.averageIntensity;

      if (metrics.averageIntensity > 200) {
        result.alerts.push({
          type: "warning",
          message: "Over-illumination detected",
          timestamp: Date.now(),
        });
      } else if (metrics.averageIntensity < 50) {
        result.alerts.push({
          type: "warning",
          message: "Under-illumination detected",
          timestamp: Date.now(),
        });
      }
    }

    if (metrics.motionScore !== undefined) {
      result.metrics.motion = metrics.motionScore;

      if (metrics.motionScore > 0.5) {
        result.alerts.push({
          type: "warning",
          message: "Please hold still",
          timestamp: Date.now(),
        });
      }
    }

    if (metrics.greenChannel !== undefined && metrics.greenChannel < 30) {
      result.alerts.push({
        type: "error",
        message: "Finger misplaced",
        timestamp: Date.now(),
      });
    }

    const qualityFactors = [];
    if (metrics.averageIntensity !== undefined) {
      const illuminationQuality = Math.max(
        0,
        1 - Math.abs(metrics.averageIntensity - 128) / 128
      );
      qualityFactors.push(illuminationQuality);
    }
    if (metrics.motionScore !== undefined) {
      qualityFactors.push(Math.max(0, 1 - metrics.motionScore));
    }

    result.signalQuality =
      qualityFactors.length > 0
        ? qualityFactors.reduce((a, b) => a + b, 0) / qualityFactors.length
        : 0;

    if (metrics.greenChannel !== undefined) {
      result.ppgValue = metrics.greenChannel;
    }

    if (result.signalQuality > 0.8 && result.alerts.length === 0) {
      result.alerts.push({
        type: "success",
        message: "Signal quality good",
        timestamp: Date.now(),
      });
    }

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Failed to process signal data",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
