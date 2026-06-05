import { Router, raw } from "express"
import ImageController from "../controllers/image.controller"
import ImageService from "../services/image.service"
import { identity } from "../middlewares/identity.middleware"
import { requireOwnership } from "../middlewares/owner.middleware"
import { ImageModel } from "../models/image.model"
import { ROLES } from "../constants/roles"

function createImageRouter(controller: ImageController = new ImageController(new ImageService())) {
  const router = Router()

  // Accept any binary body up to 16MB (MongoDB document cap).
  router.post("/", identity, raw({ type: "*/*", limit: "16mb" }), controller.uploadImage)
  router.get("/:id/meta", identity, controller.getImageMeta)
  router.get("/:id", identity, controller.getImage)
  router.delete(
    "/:id",
    identity,
    requireOwnership(ImageModel, ROLES.MODERATOR, ROLES.ADMIN),
    controller.deleteImage
  )

  return router
}

export { createImageRouter }

/**
 * @openapi
 * /images:
 *   post:
 *     summary: Upload an image
 *     description: Send raw binary in the body (no multipart). Maximum 16 MB. Requires authentication via x-user-id and x-roles headers.
 *     tags: [Images]
 *     parameters:
 *       - in: header
 *         name: x-user-id
 *         required: true
 *         schema:
 *           type: string
 *         description: Authenticated user identifier (injected by gateway). Used as ownerId.
 *       - in: header
 *         name: x-roles
 *         required: true
 *         schema:
 *           type: string
 *         description: Comma-separated roles (e.g. "user" or "admin,moderator").
 *       - in: header
 *         name: Content-Type
 *         required: true
 *         schema:
 *           type: string
 *           example: image/jpeg
 *         description: MIME type of the image.
 *       - in: header
 *         name: X-Filename
 *         schema:
 *           type: string
 *           default: upload
 *         description: Original filename.
 *     requestBody:
 *       required: true
 *       content:
 *         application/octet-stream:
 *           schema:
 *             type: string
 *             format: binary
 *     responses:
 *       201:
 *         description: Image uploaded. Raw bytes excluded from response.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ImageMeta'
 *       400:
 *         description: Missing body or invalid headers.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Missing authentication headers.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /images/{id}:
 *   get:
 *     summary: Get image bytes
 *     description: Returns raw binary with the original Content-Type set. Suitable as an `<img src="...">` target.
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Raw image bytes.
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Delete an image
 *     description: Image owner may delete. Moderators and admins may delete any image.
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       403:
 *         description: Not the image owner and lacks elevated role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 * /images/{id}/meta:
 *   get:
 *     summary: Get image metadata
 *     description: Returns metadata as JSON without transferring bytes.
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image metadata.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/ImageMeta'
 *       404:
 *         description: Not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
