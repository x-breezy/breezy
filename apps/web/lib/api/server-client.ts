import axios from "axios"

const serverClient = axios.create({
  baseURL: process.env.API_URL ?? "http://localhost",
})

export default serverClient
