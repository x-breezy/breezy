import { NodeSDK } from "@opentelemetry/sdk-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node"
import { resourceFromAttributes } from "@opentelemetry/resources"
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions"

const enabled = process.env.OTEL_ENABLED !== "false"
const serviceName =
  process.env.OTEL_SERVICE_NAME ||
  process.env.SERVICE_NAME ||
  process.env.npm_package_name ||
  "breezy-service"
const serviceVersion = process.env.SERVICE_VERSION || process.env.npm_package_version || "0.0.0"
const tracesEndpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT

let sdk: NodeSDK | undefined

if (enabled) {
  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
    }),
    traceExporter: tracesEndpoint ? new OTLPTraceExporter({ url: tracesEndpoint }) : undefined,
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  })

  sdk.start()

  process.on("SIGTERM", () => {
    sdk?.shutdown().catch((err) => console.error("[OpenTelemetry] shutdown failed", err))
  })
}

export {}
