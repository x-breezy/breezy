import ImageService from "../services/image.service"

class ImageController {
  private imageService: ImageService

  constructor(imageService: ImageService) {
    this.imageService = imageService
  }

  async uploadImage() {}

  async getImage() {}

  async deleteImage() {}
}

export default ImageController
