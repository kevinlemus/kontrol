import { api } from './client'

export interface GenerateImageResponse {
  imageId: string
  imageUrl: string
  imagePrompt: string
  seed: number
}

export const imageApi = {
  generate: (payload: {
    prompt: string
    platform: string
    projectContext: object
    seed?: number
  }): Promise<GenerateImageResponse> =>
    api.post('/api/v1/images/generate', payload),

  regenerate: (payload: {
    imageId: string
    variation: boolean
  }): Promise<GenerateImageResponse> =>
    api.post('/api/v1/images/regenerate', payload),
}
