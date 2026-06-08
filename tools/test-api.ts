#!/usr/bin/env tsx
/**
 * Automated API endpoint tester
 * Tests all endpoints defined in openapi.json
 */
import fs from "node:fs"
import path from "node:path"

const BASE_URL = process.env.API_URL || "http://localhost"
const TEST_USER = {
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: "Test1234!",
}

type Operation = {
  method: string
  path: string
  summary?: string
  tags?: string[]
  requestBody?: { content?: Record<string, { schema?: unknown }> }
  security?: unknown[]
}

type TestResult = {
  endpoint: string
  method: string
  status: "PASS" | "FAIL" | "SKIP"
  httpCode?: number
  error?: string
  duration: number
}

async function request(
  method: string,
  path: string,
  options: { token?: string; body?: unknown } = {}
): Promise<{ status: number; data: unknown }> {
  const url = `${BASE_URL}${path}`
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  }
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const text = await response.text()
  let data: unknown = text
  try {
    data = JSON.parse(text)
  } catch {
    // Not JSON, keep as text
  }

  return { status: response.status, data }
}

function extractEndpoints(): Operation[] {
  const specPath = path.join(__dirname, "../openapi.json")
  const spec = JSON.parse(fs.readFileSync(specPath, "utf-8"))

  const endpoints: Operation[] = []

  for (const [pathStr, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods as object)) {
      if (method === "parameters") continue
      const op = operation as Record<string, unknown>
      endpoints.push({
        method: method.toUpperCase(),
        path: pathStr,
        summary: op.summary as string,
        tags: op.tags as string[],
        requestBody: op.requestBody as Operation["requestBody"],
        security: op.security as unknown[] | undefined,
      })
    }
  }

  return endpoints
}

async function testEndpoint(op: Operation, token: string | null): Promise<TestResult> {
  const start = Date.now()
  const requiresAuth = op.security && Array.isArray(op.security) && op.security.length > 0

  // Skip internal endpoints
  if (op.summary?.includes("(internal)")) {
    return { endpoint: op.path, method: op.method, status: "SKIP", duration: Date.now() - start }
  }

  // Build body from schema example
  let body: unknown = undefined
  if (op.requestBody?.content?.["application/json"]?.schema) {
    const schema = op.requestBody.content["application/json"].schema as Record<string, unknown>
    body = generateExample(schema)
  }

  // Replace path params with test values
  let path = op.path
  if (path.includes("{id}")) {
    // For GET/DELETE/PATCH with path params, we expect 404 if ID doesn't exist
    path = path.replace(/{id}/g, "550e8400-e29b-41d4-a716-446655440000")
  }
  if (path.includes("{postId}")) {
    path = path.replace(/{postId}/g, "abc123")
  }
  if (path.includes("{profileId}")) {
    path = path.replace(/{profileId}/g, "550e8400-e29b-41d4-a716-446655440000")
  }
  if (path.includes("{userId}")) {
    path = path.replace(/{userId}/g, "550e8400-e29b-41d4-a716-446655440000")
  }

  try {
    // Test 1: Without token (should 401 for protected, 200/201 for public)
    if (requiresAuth && !token) {
      const { status } = await request(op.method, path)
      if (status !== 401 && status !== 403) {
        return {
          endpoint: op.path,
          method: op.method,
          status: "FAIL",
          httpCode: status,
          error: `Expected 401/403 without token, got ${status}`,
          duration: Date.now() - start,
        }
      }
    }

    // Test 2: With token
    const { status } = await request(op.method, path, { token: token || undefined, body })

    // Acceptable codes
    const acceptable = [200, 201, 204, 400, 401, 403, 404, 409, 429]
    if (!acceptable.includes(status)) {
      return {
        endpoint: op.path,
        method: op.method,
        status: "FAIL",
        httpCode: status,
        error: `Unexpected status code ${status}`,
        duration: Date.now() - start,
      }
    }

    return {
      endpoint: op.path,
      method: op.method,
      status: "PASS",
      httpCode: status,
      duration: Date.now() - start,
    }
  } catch (err) {
    return {
      endpoint: op.path,
      method: op.method,
      status: "FAIL",
      error: err instanceof Error ? err.message : String(err),
      duration: Date.now() - start,
    }
  }
}

function generateExample(schema: Record<string, unknown>): unknown {
  if (schema.type === "object" && schema.properties) {
    const result: Record<string, unknown> = {}
    for (const [key, prop] of Object.entries(schema.properties as object)) {
      const p = prop as Record<string, unknown>
      if (p.example) {
        result[key] = p.example
      } else if (p.type === "string") {
        if (p.format === "email") result[key] = "test@example.com"
        else if (p.format === "uuid") result[key] = "550e8400-e29b-41d4-a716-446655440000"
        else result[key] = "string"
      } else if (p.type === "array") {
        result[key] = []
      } else if (p.type === "boolean") {
        result[key] = true
      } else if (p.type === "integer" || p.type === "number") {
        result[key] = 1
      }
    }
    return result
  }
  return undefined
}

async function main() {
  console.log("🚀 API Endpoint Tester\n")
  console.log(`Testing against: ${BASE_URL}\n`)

  const endpoints = extractEndpoints()
  console.log(`Found ${endpoints.length} endpoints\n`)

  // Step 1: Sign up and get token
  console.log("1️⃣ Creating test user...")
  let token: string | null = null

  try {
    // Try to sign in first (if user exists from previous run)
    const signInRes = await request("POST", "/api/auth/sign-in", {
      body: { email: TEST_USER.email, password: TEST_USER.password },
    })
    if (signInRes.status === 200 && (signInRes.data as { data?: { token?: string } }).data?.token) {
      token = (signInRes.data as { data: { token: string } }).data.token
      console.log("   ✓ Signed in with existing user")
    }
  } catch {
    // Ignore
  }

  if (!token) {
    const signUpRes = await request("POST", "/api/auth/sign-up", { body: TEST_USER })
    if (signUpRes.status === 201 && (signUpRes.data as { data?: { token?: string } }).data?.token) {
      token = (signUpRes.data as { data: { token: string } }).data.token
      console.log("   ✓ Created test user and got token")
    } else {
      console.log("   ⚠ Failed to create test user, continuing without auth...")
    }
  }

  // Step 2: Test all endpoints
  console.log("\n2️⃣ Testing endpoints...\n")

  const results: TestResult[] = []
  for (const endpoint of endpoints) {
    process.stdout.write(`   ${endpoint.method.padEnd(6)} ${endpoint.path} ... `)
    const result = await testEndpoint(endpoint, token)
    results.push(result)

    if (result.status === "PASS") {
      console.log(`✓ (${result.httpCode}, ${result.duration}ms)`)
    } else if (result.status === "SKIP") {
      console.log(`⏭ SKIP`)
    } else {
      console.log(`✗ (${result.httpCode || "ERR"}: ${result.error?.slice(0, 50)})`)
    }
  }

  // Summary
  const passed = results.filter((r) => r.status === "PASS").length
  const failed = results.filter((r) => r.status === "FAIL").length
  const skipped = results.filter((r) => r.status === "SKIP").length

  console.log("\n" + "=".repeat(50))
  console.log("📊 Summary")
  console.log("=".repeat(50))
  console.log(`   Total:    ${results.length}`)
  console.log(`   ✅ Pass:   ${passed}`)
  console.log(`   ❌ Fail:   ${failed}`)
  console.log(`   ⏭ Skip:   ${skipped}`)

  if (failed > 0) {
    console.log("\n❌ Failed endpoints:")
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => console.log(`   ${r.method} ${r.endpoint}: ${r.error}`))
    process.exit(1)
  } else {
    console.log("\n✅ All tests passed!")
    process.exit(0)
  }
}

main().catch((err) => {
  console.error("Fatal error:", err)
  process.exit(1)
})
