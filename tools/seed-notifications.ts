import amqplib from "amqplib"

const EXCHANGE = "breezy.events"
const URL = process.env.RABBITMQ_URL ?? "amqp://breezy:breezy@localhost:5672"

async function publish(routingKey: string, payload: object) {
  const conn = await amqplib.connect(URL)
  const channel = await conn.createChannel()
  await channel.assertExchange(EXCHANGE, "topic", { durable: true })
  channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
  })
  console.log(`Published ${routingKey}`, payload)
  await channel.close()
  await conn.close()
}

async function main() {
  const [, , cmd] = process.argv

  if (cmd === "follow") {
    const followerId = process.argv[3] ?? "user-follower-1"
    const followingId = process.argv[4] ?? "user-target-1"
    await publish("social.follow", { followerId, followingId })
  } else if (cmd === "like") {
    const actorId = process.argv[3] ?? "user-actor-1"
    const targetUserId = process.argv[4] ?? "user-target-1"
    const postId = process.argv[5] ?? "post-1"
    await publish("content.like", { actorId, targetUserId, postId })
  } else if (cmd === "mention") {
    const actorId = process.argv[3] ?? "user-actor-1"
    const targetUserId = process.argv[4] ?? "user-target-1"
    const postId = process.argv[5] ?? "post-1"
    const commentId = process.argv[6] ?? undefined
    await publish("content.mention", { actorId, targetUserId, postId, commentId })
  } else if (cmd === "all") {
    const userId = process.argv[3] ?? "user-target-1"
    await publish("social.follow", { followerId: "alexandre_t", followingId: userId })
    await publish("social.follow", { followerId: "sophie_ux", followingId: userId })
    await publish("content.like", { actorId: "clara_dev", targetUserId: userId, postId: "post-1" })
    await publish("content.mention", {
      actorId: "sophie_ux",
      targetUserId: userId,
      postId: "post-2",
    })
    console.log("All test notifications published")
    process.exit(0)
  } else {
    console.log(`
Usage: npx tsx tools/seed-notifications.ts <command> [args]

Commands:
  all [userId]                          Publish 4 sample notifications for a user
  follow <followerId> <followingId>     Generate a follow notification
  like <actorId> <targetUserId> <postId>  Generate a like notification
  mention <actorId> <targetUserId> <postId> [commentId]  Generate a mention notification
`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
