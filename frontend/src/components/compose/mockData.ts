import { Platform, PlatformDraft, PlatformId } from './types'

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

export const MOCK_DRAFTS: Record<PlatformId, PlatformDraft> = {
  IG: {
    platformId: 'IG',
    status: 'approved',
    content: "peep 👀 finally got the parry feeling RIGHT. 3 weeks of micro-adjustments to input windows, hitstop, camera shake... it's all a science lol\n\nngl i thought feel-tuning was just vibes. it's not. every 2ms matters when your brain is trying to sync with the screen",
    hashtags: ['indiedev', 'gamedev', 'neurocat', 'solodev', 'pixelart', 'unity', 'parry'],
    selectedPostType: 'post',
  },
  TT: {
    platformId: 'TT',
    status: 'approved',
    content: "spent 3 weeks on ONE mechanic and it was worth it",
    onScreenText: "the parry mechanic finally goes crazy 🥊",
    selectedPostType: 'post',
  },
  LI: {
    platformId: 'LI',
    status: 'skipped',
    content: "3 weeks of iteration on a single mechanic taught me more about game feel than any GDC talk. The parry system in Neurocat went through 47 builds. Input windows, hitstop frames, audio cues, camera micro-shakes — each variable compounds. What looks like polish is actually systems thinking.",
    selectedPostType: 'post',
  },
  RD: {
    platformId: 'RD',
    status: 'draft',
    title: 'parry mechanic deep dive — 3 weeks of feel-tuning in neurocat',
    subreddit: 'bedroomproducers',
    subredditReasoning: 'Best fit — content matches this vocal production community',
    content: "hey r/IndieDev — wrapped up a 3-week iteration cycle on the parry mechanic for neurocat and honestly it wrecked me lol\n\nwent through like 47 builds. started with a 6-frame input window, ended at 9. added 3 frames of hitstop. camera shake on successful parry was 0.08 intensity and now it's 0.14. added a chromatic aberration flash.\n\nevery single change alone felt like nothing. together it feels like a different game.\n\nngl i used to think 'game feel' was just vibes. it's not — it's a science. wanted to share in case anyone else is deep in the sauce on a mechanic and wondering if it's worth the obsession. it is.",
    selectedPostType: 'text',
  },
  X: {
    platformId: 'X',
    status: 'draft',
    content: "spent 3 weeks tuning one parry mechanic\n\n47 builds. 9 frame input window. 0.14 camera shake intensity. 3f hitstop.\n\ngame feel is not vibes. it's science lol",
    selectedPostType: 'tweet',
  },
  FB: {
    platformId: 'FB',
    status: 'draft',
    content: "Dev update from the Neurocat bunker 🧠⚔️\n\nJust wrapped 3 weeks obsessing over the parry mechanic. Not gonna lie — there were days I questioned everything. But the system is finally clicking.\n\nInput window, hitstop, camera shake, audio layers — it all has to work together or it feels off. The difference between 6 and 9 frames is the difference between 'meh' and 'YOOO'.\n\nMore updates soon. We're cooking.",
    selectedPostType: 'post',
  },
  YT: {
    platformId: 'YT',
    status: 'draft',
    content: "DEVLOG UPDATE: The parry mechanic in Neurocat just hit a new milestone after 3 weeks of feel-tuning. In this video I break down exactly what changed across 47 builds — input windows, hitstop frames, camera shake intensity, and why every 2ms matters when you're designing for flow state.",
    selectedPostType: 'short',
  },
  ST: {
    platformId: 'ST',
    status: 'draft',
    title: 'Devlog #12 — The Parry Deep Dive',
    content: "Wrapped up a 3-week iteration sprint on the parry system. This one was deep.\n\nThe goal: make the parry feel so good that landing one becomes a micro-dopamine hit. After 47 builds, I think we're there.\n\nKey changes:\n• Input window: 6f → 9f\n• Hitstop: 0 → 3f\n• Camera shake intensity: 0.08 → 0.14\n• Added chromatic aberration flash on success\n\nEach change alone felt minor. Together they're a different game. Stay tuned — combat system reveal is close.",
    selectedPostType: 'devlog',
  },
  IT: {
    platformId: 'IT',
    status: 'draft',
    title: 'Devlog: 3 Weeks, 47 Builds, One Parry',
    content: "sometimes you go into a sprint thinking 'i'll fix the parry this week' and come out 3 weeks later with a spreadsheet of frame data\n\nthat was me. but it worked lol\n\nneurocat's parry system is now where it needs to be. more devlog soon with side-by-side video.",
    selectedPostType: 'devlog',
  },
  GJ: {
    platformId: 'GJ',
    status: 'draft',
    title: 'Devlog: The Parry Mechanic Finally Slaps',
    content: "big week in the neurocat lab 🧪\n\n3 weeks of feel-tuning on the parry system just wrapped. 47 builds. the mechanic went from 'fine i guess' to 'wait do that again'\n\ncombat reveal is getting closer. following along if you want the behind-the-scenes chaos.",
    selectedPostType: 'devlog',
  },
}
