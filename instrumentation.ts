import { registerOTel } from "@vercel/otel";

// Sends traces to the shared Grafana Cloud stack, where Tempo derives the
// RED metrics that controlpanel reads. Configured entirely through env vars
// (OTEL_SERVICE_NAME, OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_EXPORTER_OTLP_HEADERS)
// so no credentials live in the repo.
export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "kidsacademy",
  });
}
