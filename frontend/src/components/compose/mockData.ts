import { Platform, PlatformId } from './types'

export const PLATFORMS: Platform[] = [
  {
    id: 'IG',
    name: 'Instagram',
    postType: 'post',
    gradient: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)',
    gradientColors: ['#F58529', '#8134AF'],
  },
  {
    id: 'TT',
    name: 'TikTok',
    postType: 'short',
    gradient: 'linear-gradient(135deg, #010101, #69C9D0)',
    gradientColors: ['#010101', '#69C9D0'],
  },
  {
    id: 'LI',
    name: 'LinkedIn',
    postType: 'post',
    gradient: 'linear-gradient(135deg, #0A66C2, #0077B5)',
    gradientColors: ['#0A66C2', '#0077B5'],
  },
  {
    id: 'RD',
    name: 'Reddit',
    postType: 'text',
    gradient: 'linear-gradient(135deg, #FF4500, #FF6534)',
    gradientColors: ['#FF4500', '#FF6534'],
  },
  {
    id: 'X',
    name: 'X',
    postType: 'tweet',
    gradient: 'linear-gradient(135deg, #000000, #333333)',
    gradientColors: ['#1a1a1a', '#333333'],
  },
  {
    id: 'FB',
    name: 'Facebook',
    postType: 'post',
    gradient: 'linear-gradient(135deg, #1877F2, #0C5FCF)',
    gradientColors: ['#1877F2', '#0C5FCF'],
  },
  {
    id: 'YT',
    name: 'YouTube',
    postType: 'announcement',
    gradient: 'linear-gradient(135deg, #FF0000, #CC0000)',
    gradientColors: ['#FF0000', '#CC0000'],
  },
  {
    id: 'ST',
    name: 'Steam',
    postType: 'devlog',
    gradient: 'linear-gradient(135deg, #1B2838, #2A475E)',
    gradientColors: ['#1B2838', '#2A475E'],
  },
  {
    id: 'IT',
    name: 'itch.io',
    postType: 'devlog',
    gradient: 'linear-gradient(135deg, #FA5C5C, #E63946)',
    gradientColors: ['#FA5C5C', '#E63946'],
  },
  {
    id: 'GJ',
    name: 'Game Jolt',
    postType: 'devlog',
    gradient: 'linear-gradient(135deg, #2F7F3E, #45B069)',
    gradientColors: ['#2F7F3E', '#45B069'],
  },
]

export const PLATFORM_MAP: Record<PlatformId, Platform> = Object.fromEntries(
  PLATFORMS.map(p => [p.id, p])
) as Record<PlatformId, Platform>
