import amqplib from "amqplib"

jest.mock("amqplib")
const mockConnect = amqplib.connect as jest.MockedFunction<typeof amqplib.connect>

const mockChannel = {
  assertExchange: jest.fn(),
  publish: jest.fn(),
}

let connectRabbitMQ: (...args: unknown[]) => Promise<void>
let publish: (routingKey: string, payload: object) => Promise<void>

function loadModule() {
  jest.isolateModules(() => {
    const mod = require("../../clients/rabbitmq")
    connectRabbitMQ = mod.connectRabbitMQ
    publish = mod.publish
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("connectRabbitMQ", () => {
  it("connects to broker and asserts exchange", async () => {
    mockConnect.mockResolvedValue({
      createChannel: jest.fn().mockResolvedValue(mockChannel),
    } as never)

    loadModule()
    await connectRabbitMQ()

    expect(mockConnect).toHaveBeenCalledWith("amqp://breezy:breezy@localhost:5672")
    expect(mockChannel.assertExchange).toHaveBeenCalledWith("breezy.events", "topic", {
      durable: true,
    })
  })

  it("handles connection error gracefully", async () => {
    mockConnect.mockRejectedValue(new Error("Connection refused"))

    loadModule()
    await expect(connectRabbitMQ()).resolves.toBeUndefined()
  })
})

describe("publish", () => {
  it("serializes payload and publishes to exchange", async () => {
    mockConnect.mockResolvedValue({
      createChannel: jest.fn().mockResolvedValue(mockChannel),
    } as never)

    loadModule()
    await connectRabbitMQ()

    const payload = { followerId: "user-1", followingId: "user-2" }
    await publish("social.follow", payload)

    expect(mockChannel.publish).toHaveBeenCalledWith(
      "breezy.events",
      "social.follow",
      Buffer.from(JSON.stringify(payload)),
      { persistent: true }
    )
  })

  it("does not publish when channel is null", async () => {
    loadModule()
    await publish("social.follow", { foo: "bar" })

    expect(mockChannel.publish).not.toHaveBeenCalled()
  })
})
