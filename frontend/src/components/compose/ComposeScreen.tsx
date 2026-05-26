import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ComposeState, PlatformId, PostType } from './types'
import { PLATFORM_MAP, PLATFORMS } from './mockData'
import { InputBlock } from './InputBlock'
import { GenerateButton } from './GenerateButton'
import { BatchStatusBar } from './BatchStatusBar'
import { ChipStrip } from './ChipStrip'
import { ActiveCard } from './ActiveCard'
import { PlatformQueue } from './PlatformQueue'
import { SmartScheduleModal, ScheduledEntry } from './SmartScheduleModal'
import { PlatformSelectSheet } from './PlatformSelectSheet'
import { useToast } from '../shared/Toast'
import { generateApi } from '../../api/generate'
import { performanceApi } from '../../api/performance'
import { useAuth } from '../../contexts/AuthContext'
import { projectsApi } from '../../api/projects'
import { connectionsApi } from '../../api/connections'
import type { GenerateResponse, PerformanceInsightDto } from '../../api/types'

const ALL_PLATFORM_IDS: PlatformId[] = ['IG', 'TT', 'LI', 'RD', 'X', 'FB', 'YT', 'ST', 'IT', 'GJ']

// Fallback platform lists when a project has no platform config
const PLATFORM_FALLBACKS: Record<string, PlatformId[]> = {}

interface StoredProject {
  id: string
  name: string
  active: boolean
  platforms: Record<string, { enabled: boolean }>
  whatItIs?: string
  whoItsFor?: string
  vibe?: string
  currentStatus?: string
  industry?: string
  competitor1?: string
  competitor2?: string
  competitor3?: string
}

function getEnabledPlatformsFromProject(project: StoredProject | null, projectName: string): PlatformId[] {
  if (project?.platforms) {
    const enabled = (Object.entries(project.platforms) as [string, { enabled: boolean }][])
      .filter(([, cfg]) => cfg.enabled)
      .map(([id]) => id as PlatformId)
    if (enabled.length > 0) return enabled
  }
  return PLATFORM_FALLBACKS[projectName] ?? ALL_PLATFORM_IDS
}

// ─── Project color helpers ────────────────────────────────────────────────────

const DOT_PALETTE = ['#3B82F6', '#1ED760', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#F97316']

function getProjectDotColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return DOT_PALETTE[Math.abs(h) % DOT_PALETTE.length]
}

// ─── Project Switcher Dropdown ────────────────────────────────────────────────

interface ProjectSwitcherProps {
  currentName: string
  onSwitch: (proj: StoredProject) => void
  projects: StoredProject[]
  onActivate: (id: string) => void
}

function ProjectSwitcher({ currentName, onSwitch, projects, onActivate }: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open])

  const handleSelect = (proj: StoredProject) => {
    if (proj.active) { setOpen(false); return }
    onActivate(proj.id)
    onSwitch(proj)
    setOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/* Pill trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: '4px 10px 4px 8px',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'var(--font-body)',
          color: 'var(--text-primary)',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: getProjectDotColor(currentName),
          flexShrink: 0,
        }} />
        {currentName}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, flexShrink: 0 }}>
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            background: 'var(--bg-card)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '6px 0',
            minWidth: 200,
            maxWidth: '90vw',
            zIndex: 150,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            marginTop: 4,
            transformOrigin: 'top right',
            animation: 'dropdownIn 150ms ease-out forwards',
          }}
        >
          <style>{`
            @keyframes dropdownIn {
              from { opacity: 0; transform: scaleY(0.95); }
              to   { opacity: 1; transform: scaleY(1); }
            }
          `}</style>
          {projects.length === 0 && (
            <div style={{
              padding: '8px 16px',
              fontSize: 12,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-body)',
            }}>
              No projects found
            </div>
          )}
          {projects.map(proj => (
            <button
              key={proj.id}
              onClick={() => handleSelect(proj)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                padding: '8px 16px',
                background: 'none',
                border: 'none',
                cursor: proj.active ? 'default' : 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e => { if (!proj.active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: getProjectDotColor(proj.name),
                flexShrink: 0,
              }} />
              <span style={{
                flex: 1,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'var(--font-body)',
                color: 'var(--text-primary)',
              }}>
                {proj.name}
              </span>
              {proj.active && (
                <span style={{
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--accent)',
                  background: 'rgba(59,130,246,0.12)',
                  border: '1px solid rgba(59,130,246,0.25)',
                  borderRadius: 999,
                  padding: '2px 6px',
                  letterSpacing: 0.4,
                }}>
                  ACTIVE
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Compose Top Bar (replaces TopBar import) ─────────────────────────────────

interface ComposeTopBarProps {
  projectName: string
  onProjectSwitch: (proj: StoredProject) => void
  activeProject?: StoredProject
  projects: StoredProject[]
  onActivate: (id: string) => void
}

function ComposeTopBar({ projectName, onProjectSwitch, activeProject, projects, onActivate }: ComposeTopBarProps) {
  const [showProjectInfo, setShowProjectInfo] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showProjectInfo) return
    const handler = (e: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setShowProjectInfo(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showProjectInfo])

  const proj = activeProject

  const infoRows: { label: string; value: string | undefined }[] = [
    { label: 'What it is', value: proj?.whatItIs },
    { label: "Who it's for", value: proj?.whoItsFor },
    { label: 'Vibe', value: proj?.vibe },
    ...(proj?.industry ? [{ label: 'Industry', value: proj.industry }] : []),
    { label: 'Status', value: proj?.currentStatus },
  ]

  const competitorList = [proj?.competitor1, proj?.competitor2, proj?.competitor3]
    .filter((c): c is string => Boolean(c))
  if (competitorList.length > 0) {
    infoRows.splice(infoRows.length - 1, 0, {
      label: 'Competitors',
      value: competitorList.join(', '),
    })
  }

  return (
    <div style={{
      minHeight: 'calc(48px + max(env(safe-area-inset-top), 44px))',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      padding: '0 16px',
      paddingTop: 'max(env(safe-area-inset-top), 44px)',
      flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      position: 'relative',
    }}>
      {/* Wordmark */}
      <span style={{
        fontFamily: 'var(--font-body)',
        fontWeight: 800,
        fontSize: 18,
        letterSpacing: -0.5,
        background: 'linear-gradient(90deg, #fff 60%, rgba(255,255,255,0.5) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
      }}>
        kontrol
      </span>

      {/* Project switcher pill + info button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <ProjectSwitcher currentName={projectName} onSwitch={onProjectSwitch} projects={projects} onActivate={onActivate} />

        {/* Info button + popover */}
        <div ref={infoRef} style={{ position: 'relative', display: 'inline-block' }}>
          <button
            onClick={() => setShowProjectInfo(v => !v)}
            aria-label="Project info"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: showProjectInfo ? '#3B82F6' : '#555',
              fontSize: 16,
              padding: '0 6px',
              lineHeight: 1,
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'color .15s',
            }}
          >
            &#9432;
          </button>

          {showProjectInfo && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: '#181818',
              border: '1px solid #333',
              borderRadius: 12,
              padding: 16,
              minWidth: 280,
              maxWidth: 400,
              zIndex: 100,
              boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            }}>
              {/* Project name */}
              <div style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: 15,
                color: '#fff',
                marginBottom: 12,
              }}>
                {projectName}
              </div>

              {/* Info rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {infoRows.map(row => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{
                      fontSize: 12,
                      color: '#666',
                      fontFamily: 'var(--font-body)',
                      width: 110,
                      flexShrink: 0,
                      paddingTop: 1,
                    }}>
                      {row.label}
                    </span>
                    <span style={{
                      fontSize: 14,
                      color: row.value ? '#fff' : '#444',
                      fontFamily: 'var(--font-body)',
                      flex: 1,
                      lineHeight: 1.4,
                    }}>
                      {row.value || '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Mic Button / Voice Input ─────────────────────────────────────────────────

interface VoiceInputProps {
  onTranscript: (text: string) => void
}

function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const { showToast } = useToast()

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      showToast('Voice input not supported on this browser')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onTranscript(transcript)
      setListening(false)
    }
    recognition.onerror = () => { setListening(false) }
    recognition.onend = () => { setListening(false) }
    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      flexShrink: 0,
    }}>
      <style>{`
        @keyframes micPulse {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Mic button */}
      <button
        onClick={listening ? stopListening : startListening}
        aria-label={listening ? 'Stop recording' : 'Start voice input'}
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: listening ? 'rgba(255,70,70,0.2)' : 'rgba(255,255,255,0.06)',
          border: `1px solid ${listening ? 'rgba(255,70,70,0.5)' : 'rgba(255,255,255,0.1)'}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          animation: listening ? 'micPulse 800ms ease-in-out infinite' : 'none',
          transition: 'background .2s, border-color .2s',
        }}
      >
        {listening ? (
          // Stop (square) icon
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="2" width="10" height="10" rx="2" fill="currentColor" style={{ color: '#FF4646' }}/>
          </svg>
        ) : (
          // Mic icon
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="6" y="1" width="6" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-muted)' }}/>
            <path d="M3 9a6 6 0 0012 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--text-muted)' }}/>
            <path d="M9 15v2M6.5 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ color: 'var(--text-muted)' }}/>
          </svg>
        )}
      </button>

      {/* Listening indicator */}
      {listening && (
        <span style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: '#FF4646',
        }}>
          Listening…
        </span>
      )}
    </div>
  )
}

// ─── Layout hook ──────────────────────────────────────────────────────────────

function useComposeLayout() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isDesktop
}

// ─── Initial compose state builder ───────────────────────────────────────────

function buildInitialState(): ComposeState {
  return {
    projectName: '',
    prompt: '',
    mediaUrl: null,
    activePlatformId: 'IG',
    drafts: {} as Record<string, never> as ComposeState['drafts'],
    generated: false,
  }
}

// ─── Main ComposeScreen ───────────────────────────────────────────────────────

export function ComposeScreen() {
  const isDesktop = useComposeLayout()
  const navigate = useNavigate()
  const { user } = useAuth()
  const userName = user?.name ?? 'Creator'
  const { showToast } = useToast()

  // projectKey increments whenever the active project changes — forces re-derivation
  const [projectKey, setProjectKey] = useState(0)

  // API-driven project list
  const [apiProjects, setApiProjects] = useState<StoredProject[]>([])
  const [projectsReady, setProjectsReady] = useState(false)

  // Load projects from API on mount
  useEffect(() => {
    projectsApi.list()
      .then(list => {
        const mapped: StoredProject[] = list.map((p, idx) => ({
          id: p.id,
          name: p.name,
          active: p.active,
          platforms: {},
          whatItIs: p.whatItIs ?? undefined,
          whoItsFor: p.whoItsFor ?? undefined,
          vibe: p.vibe ?? undefined,
          currentStatus: p.currentStatus ?? undefined,
          industry: p.industry ?? undefined,
          competitor1: p.competitor1 ?? undefined,
          competitor2: p.competitor2 ?? undefined,
          competitor3: p.competitor3 ?? undefined,
          // Assign first project as active if none are flagged
          ...(idx === 0 && !list.some(x => x.active) ? { active: true } : {}),
        }))
        setApiProjects(mapped)
        // Sync active project name into compose state
        const active = mapped.find(p => p.active)
        if (active) {
          setState(prev => ({ ...prev, projectName: active.name }))
        }
        setProjectsReady(true)
      })
      .catch(() => {
        // Backend offline — keep current state
        setProjectsReady(true)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeStoredProject = apiProjects.find(p => p.active) ?? null
  const activeProjectId = activeStoredProject?.id ?? null

  const [state, setState] = useState<ComposeState>(buildInitialState)
  const [generating, setGenerating] = useState(false)
  const [showSmartSchedule, setShowSmartSchedule] = useState(false)
  const [showPlatformSheet, setShowPlatformSheet] = useState(false)
  const [insights, setInsights] = useState<PerformanceInsightDto[] | null>(null)
  const [postPlatformIds, setPostPlatformIds] = useState<Record<string, string>>({})
  const [originalContents, setOriginalContents] = useState<Record<string, string>>({})
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])

  // ── Load connection status when active project changes ─────────────────────
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const list = activeProjectId
          ? await connectionsApi.list(activeProjectId)
          : await connectionsApi.list()
        setConnectedPlatforms(list.filter(c => c.connected).map(c => c.platform))
      } catch {
        // Backend offline — leave empty (chips show no badge)
        setConnectedPlatforms([])
      }
    }
    void fetchConnections()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProjectId])

  // ── Voice learning tip banner ──────────────────────────────────────────────
  const [showTip, setShowTip] = useState(
    () => localStorage.getItem('kontrol_compose_tip_shown') !== 'true'
  )
  const dismissTip = () => {
    localStorage.setItem('kontrol_compose_tip_shown', 'true')
    setShowTip(false)
  }

  // Re-derive enabled platforms from API project data
  const enabledPlatforms = getEnabledPlatformsFromProject(activeStoredProject, state.projectName)

  // Per-generation platform selection — defaults to all enabled platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(enabledPlatforms)

  // Reset when project changes
  useEffect(() => {
    setSelectedPlatforms(getEnabledPlatformsFromProject(activeStoredProject, state.projectName))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.projectName, projectKey, activeStoredProject])

  const handleActivateProject = useCallback((id: string) => {
    // Optimistically update local state
    setApiProjects(prev => prev.map(p => ({ ...p, active: p.id === id })))
    // Fire and forget API call
    projectsApi.activate(id).catch(() => {})
  }, [])

  const handleProjectSwitch = useCallback((proj: StoredProject) => {
    setState(prev => ({ ...prev, projectName: proj.name }))
    setProjectKey(k => k + 1)
  }, [])

  const handleTogglePlatform = useCallback((id: PlatformId) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }, [])

  const activePlatform = PLATFORM_MAP[state.activePlatformId]
  const activeDraft = state.drafts[state.activePlatformId]

  const allApproved = selectedPlatforms.length > 0 &&
    selectedPlatforms.every(id => {
      const s = state.drafts[id]?.status
      return s === 'approved' || s === 'skipped'
    }) &&
    selectedPlatforms.some(id => state.drafts[id]?.status === 'approved')

  const handleSmartScheduleConfirm = useCallback(async (entries: ScheduledEntry[]) => {
    // Detect overrides — finalize all platforms where content was edited
    const finalizePromises = Object.entries(postPlatformIds)
      .filter(([pid]) => {
        const draft = state.drafts[pid as PlatformId]
        return draft && originalContents[pid] !== undefined && draft.content !== originalContents[pid]
      })
      .map(([pid, ppId]) => {
        const draft = state.drafts[pid as PlatformId]
        return performanceApi.finalizePostPlatform(ppId, draft.content).catch(() => {})
      })
    await Promise.all(finalizePromises)

    const batch = {
      id: `batch-${Date.now()}`,
      createdAt: new Date().toISOString(),
      projectName: state.projectName,
      posts: entries,
    }
    try {
      const existing = JSON.parse(localStorage.getItem('kontrol_smart_schedule') ?? '[]')
      existing.push(batch)
      localStorage.setItem('kontrol_smart_schedule', JSON.stringify(existing))
    } catch {}
    setShowSmartSchedule(false)
    navigate('/schedule')
  }, [state.projectName, state.drafts, postPlatformIds, originalContents, navigate])

  const handleGenerate = useCallback(async () => {
    setGenerating(true)

    const active = apiProjects.find(p => p.active)
    if (!active?.id || active.id === 'local') {
      showToast('Select a project before generating')
      setGenerating(false)
      return
    }

    try {
      const resp: GenerateResponse = await generateApi.generate({
        projectId: active.id,
        prompt: state.prompt,
        platforms: selectedPlatforms,
      })
      // Build new drafts from API response
      const newDrafts = { ...state.drafts }
      for (const [pid, apiDraft] of Object.entries(resp.drafts)) {
        const platformId = pid as PlatformId
        newDrafts[platformId] = {
          ...newDrafts[platformId],
          content: apiDraft.content,
          title: apiDraft.title ?? newDrafts[platformId]?.title ?? '',
          subreddit: apiDraft.selectedSubreddit ?? newDrafts[platformId]?.subreddit,
          subredditReasoning: apiDraft.subredditReasoning ?? newDrafts[platformId]?.subredditReasoning,
          status: 'pending' as const,
          postPlatformId: apiDraft.postPlatformId ?? undefined,
          hook: apiDraft.hook ?? undefined,
        }
      }

      if (resp.insights) setInsights(resp.insights)

      // Store postPlatformIds per platform
      const ids: Record<string, string> = {}
      const originals: Record<string, string> = {}
      Object.entries(resp.drafts).forEach(([pid, apiDraft]) => {
        if (apiDraft.postPlatformId) ids[pid] = apiDraft.postPlatformId
        originals[pid] = apiDraft.content
      })
      setPostPlatformIds(ids)
      setOriginalContents(originals)

      setGenerating(false)
      setState(prev => ({
        ...prev,
        drafts: newDrafts,
        generated: true,
      }))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed'
      let displayMsg = msg
      if (msg.startsWith('API ')) {
        const jsonStart = msg.indexOf('{')
        if (jsonStart !== -1) {
          try {
            const parsed = JSON.parse(msg.slice(jsonStart)) as { error?: string }
            if (parsed.error) displayMsg = parsed.error
          } catch { /* use original */ }
        }
      }
      showToast(`Generate failed — ${displayMsg}`)
      setGenerating(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.prompt, state.drafts, selectedPlatforms, apiProjects])

  const handleSelectPlatform = useCallback((id: PlatformId) => {
    setState(prev => ({ ...prev, activePlatformId: id }))
    // Show informational toast if platform is not connected (Reddit uses API key, not OAuth)
    if (id !== 'RD' && connectedPlatforms.length > 0 && !connectedPlatforms.includes(id)) {
      const platform = PLATFORM_MAP[id]
      showToast(`Connect ${platform?.name ?? id} in Settings to publish directly. Posts can still be generated and copied.`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectedPlatforms])

  const handleContentChange = useCallback((content: string) => {
    setState(prev => ({
      ...prev,
      drafts: {
        ...prev.drafts,
        [prev.activePlatformId]: { ...prev.drafts[prev.activePlatformId], content },
      },
    }))
  }, [])

  const handleTitleChange = useCallback((title: string) => {
    setState(prev => ({
      ...prev,
      drafts: {
        ...prev.drafts,
        [prev.activePlatformId]: { ...prev.drafts[prev.activePlatformId], title },
      },
    }))
  }, [])

  const handleApprove = useCallback(() => {
    setState(prev => {
      const drafts = {
        ...prev.drafts,
        [prev.activePlatformId]: { ...prev.drafts[prev.activePlatformId], status: 'approved' as const },
      }
      const currentIdx = selectedPlatforms.indexOf(prev.activePlatformId)
      const next = selectedPlatforms.find((id, i) => {
        if (i <= currentIdx) return false
        const s = drafts[id]?.status
        return s !== 'approved' && s !== 'skipped'
      }) ?? prev.activePlatformId
      return { ...prev, drafts, activePlatformId: next }
    })
  }, [selectedPlatforms])

  const handleRegenerate = useCallback(() => {
    setState(prev => ({
      ...prev,
      drafts: {
        ...prev.drafts,
        [prev.activePlatformId]: { ...prev.drafts[prev.activePlatformId], status: 'generating' as const },
      },
    }))
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        drafts: {
          ...prev.drafts,
          [prev.activePlatformId]: { ...prev.drafts[prev.activePlatformId], status: 'draft' as const },
        },
      }))
    }, 1200)
  }, [])

  const handleTypeChange = useCallback((postType: PostType) => {
    setState(prev => ({
      ...prev,
      drafts: {
        ...prev.drafts,
        [prev.activePlatformId]: { ...prev.drafts[prev.activePlatformId], selectedPostType: postType },
      },
    }))
  }, [])

  const handleSkip = useCallback(() => {
    setState(prev => {
      const drafts = {
        ...prev.drafts,
        [prev.activePlatformId]: { ...prev.drafts[prev.activePlatformId], status: 'skipped' as const },
      }
      const currentIdx = selectedPlatforms.indexOf(prev.activePlatformId)
      const next = selectedPlatforms.find((id, i) => {
        if (i <= currentIdx) return false
        const s = drafts[id]?.status
        return s !== 'approved' && s !== 'skipped'
      }) ?? prev.activePlatformId
      return { ...prev, drafts, activePlatformId: next }
    })
  }, [selectedPlatforms])

  const handleDiscardBatch = useCallback(() => {
    setState(buildInitialState())
  }, [])

  const handleSubredditChange = useCallback((subreddit: string) => {
    setState(prev => ({
      ...prev,
      drafts: {
        ...prev.drafts,
        RD: { ...prev.drafts.RD, subreddit },
      },
    }))
  }, [])

  const handleVoiceTranscript = useCallback((transcript: string) => {
    setState(prev => ({
      ...prev,
      prompt: prev.prompt ? prev.prompt + ' ' + transcript : transcript,
    }))
  }, [])

  // ─── Desktop layout ─────────────────────────────────────────────────────────

  if (isDesktop) {
    return (
      <div style={{
        display: 'flex',
        height: '100%',
        background: 'var(--bg-base)',
        overflow: 'hidden',
      }}>
        {/* Left: Platform Queue */}
        <PlatformQueue
          drafts={state.drafts}
          activePlatformId={state.activePlatformId}
          onSelectPlatform={handleSelectPlatform}
          enabledPlatforms={enabledPlatforms}
          selectedPlatforms={selectedPlatforms}
          onTogglePlatform={handleTogglePlatform}
        />

        {/* Right: Main panel */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: '16px 20px 20px',
          gap: 10,
        }}>
          <ComposeTopBar projectName={state.projectName} onProjectSwitch={handleProjectSwitch} activeProject={activeStoredProject ?? undefined} projects={apiProjects} onActivate={handleActivateProject} />

          {/* Voice learning tip banner — desktop */}
          {showTip && (
            <div style={{
              background: '#1c1c2e',
              border: '1px solid #3B82F6',
              borderRadius: 10,
              padding: '14px 16px',
              margin: '0 0 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    marginBottom: 4,
                  }}>
                    Kontrol learns your voice as you go
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    color: '#aaa',
                  }}>
                    Edit any generated post and Kontrol remembers your style
                    for that platform. The more you use it, the better it gets.
                  </div>
                </div>
                <button
                  onClick={dismissTip}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#3B82F6',
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    cursor: 'pointer',
                    padding: 0,
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Got it
                </button>
              </div>
            </div>
          )}

          {/* Input + voice row — or empty state if no projects */}
          {projectsReady && apiProjects.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>
                Create a project first to start generating posts.
              </div>
              <button
                onClick={() => navigate('/projects')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 0',
                }}
              >
                Go to Projects →
              </button>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <InputBlock
                  prompt={state.prompt}
                  onPromptChange={p => setState(prev => ({ ...prev, prompt: p }))}
                  mediaUrl={state.mediaUrl}
                  onMediaDrop={url => setState(prev => ({ ...prev, mediaUrl: url }))}
                  desktop
                  hook={state.drafts[state.activePlatformId]?.hook}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 2 }}>
                  <VoiceInput onTranscript={handleVoiceTranscript} />
                </div>
              </div>

              <GenerateButton
                onGenerate={handleGenerate}
                generating={generating}
                desktop
                platformCount={selectedPlatforms.length}
              />
            </>
          )}

          <BatchStatusBar
            drafts={state.drafts}
            activePlatformId={state.activePlatformId}
            enabledPlatforms={selectedPlatforms}
            desktop
          />

          {allApproved && state.generated && (
            <div style={{
              padding: '0 14px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <div style={{
                flex: 1,
                background: 'rgba(30,215,96,0.07)',
                border: '1px solid rgba(30,215,96,0.2)',
                borderRadius: 12,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1ED760', fontFamily: 'var(--font-body)' }}>
                    All platforms approved ✓
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                    Ready to schedule
                  </div>
                </div>
                <button
                  onClick={() => setShowSmartSchedule(true)}
                  style={{
                    padding: '8px 18px',
                    background: '#1ED760',
                    color: '#000',
                    border: 'none',
                    borderRadius: 999,
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Smart Schedule →
                </button>
              </div>
            </div>
          )}

          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ActiveCard
              draft={activeDraft}
              platform={activePlatform}
              onContentChange={handleContentChange}
              onTitleChange={handleTitleChange}
              onTypeChange={handleTypeChange}
              onApprove={handleApprove}
              onRegenerate={handleRegenerate}
              onSkip={handleSkip}
              onDiscardBatch={handleDiscardBatch}
              desktop
              projectName={state.projectName}
              projectId={activeProjectId ?? undefined}
              onSubredditChange={handleSubredditChange}
              insights={insights}
              userName={userName}
            />
          </div>
        </div>

        {showSmartSchedule && (
          <SmartScheduleModal
            drafts={state.drafts}
            enabledPlatforms={selectedPlatforms}
            platforms={PLATFORMS}
            projectName={state.projectName}
            onConfirm={handleSmartScheduleConfirm}
            onClose={() => setShowSmartSchedule(false)}
          />
        )}
      </div>
    )
  }

  // ─── Mobile layout ───────────────────────────────────────────────────────────

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-base)',
      overflow: 'hidden',
    }}>
      <ComposeTopBar projectName={state.projectName} onProjectSwitch={handleProjectSwitch} activeProject={activeStoredProject ?? undefined} projects={apiProjects} onActivate={handleActivateProject} />

      {/* Scrollable content above card */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Voice learning tip banner — mobile */}
        {showTip && (
          <div style={{
            background: '#1c1c2e',
            border: '1px solid #3B82F6',
            borderRadius: 10,
            padding: '14px 16px',
            margin: '10px 14px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: 4,
                }}>
                  Kontrol learns your voice as you go
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: '#aaa',
                }}>
                  Edit any generated post and Kontrol remembers your style
                  for that platform. The more you use it, the better it gets.
                </div>
              </div>
              <button
                onClick={dismissTip}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3B82F6',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  cursor: 'pointer',
                  padding: 0,
                  flexShrink: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {/* Input + voice row — or empty state if no projects */}
        {projectsReady && apiProjects.length === 0 ? (
          <div style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>
              Create a project first to start generating posts.
            </div>
            <button
              onClick={() => navigate('/projects')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              Go to Projects →
            </button>
          </div>
        ) : (
          <div>
            <InputBlock
              prompt={state.prompt}
              onPromptChange={p => setState(prev => ({ ...prev, prompt: p }))}
              mediaUrl={state.mediaUrl}
              onMediaDrop={url => setState(prev => ({ ...prev, mediaUrl: url }))}
              hook={state.drafts[state.activePlatformId]?.hook}
            />
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px 10px', gap: 8 }}>
              <VoiceInput onTranscript={handleVoiceTranscript} />
            </div>
          </div>
        )}

        {/* Platform summary row — mobile only */}
        <div style={{ padding: '0 14px 10px' }}>
          <div
            onClick={() => setShowPlatformSheet(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minHeight: 44,
              padding: '8px 12px',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              transition: 'background .15s, border-color .15s',
            }}
            onMouseDown={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.09)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
            }}
            onMouseUp={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
          >
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              flexShrink: 0,
            }}>
              Posting to:
            </span>
            {/* Platform chips */}
            <div style={{ display: 'flex', gap: 5, flex: 1, flexWrap: 'nowrap', alignItems: 'center', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
              {selectedPlatforms.map(id => {
                const plat = PLATFORM_MAP[id]
                return (
                  <span
                    key={id}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: plat.gradient,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 9,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      color: '#fff',
                    }}
                  >
                    {id}
                  </span>
                )
              })}
              {selectedPlatforms.length === 0 && (
                <span style={{ fontSize: 12, color: '#EF4444', fontFamily: 'var(--font-mono)' }}>none selected</span>
              )}
            </div>
            {/* Count + chevron */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <span style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
              }}>
                {selectedPlatforms.length}
              </span>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.5 }}>
                <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 14px 10px' }}>
          <GenerateButton
            onGenerate={handleGenerate}
            generating={generating}
            desktop={false}
            platformCount={selectedPlatforms.length}
          />
        </div>

        <BatchStatusBar
          drafts={state.drafts}
          activePlatformId={state.activePlatformId}
          enabledPlatforms={selectedPlatforms}
        />

        {allApproved && state.generated && (
          <div style={{
            padding: '0 14px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              flex: 1,
              background: 'rgba(30,215,96,0.07)',
              border: '1px solid rgba(30,215,96,0.2)',
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1ED760', fontFamily: 'var(--font-body)' }}>
                  All platforms approved ✓
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  Ready to schedule
                </div>
              </div>
              <button
                onClick={() => setShowSmartSchedule(true)}
                style={{
                  padding: '8px 18px',
                  background: '#1ED760',
                  color: '#000',
                  border: 'none',
                  borderRadius: 999,
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Smart Schedule →
              </button>
            </div>
          </div>
        )}

        {/* Only render chips for platforms enabled on this project */}
        {(() => {
          const visiblePlatforms = selectedPlatforms.filter(id => enabledPlatforms.includes(id))
          return (
            <ChipStrip
              drafts={state.drafts}
              activePlatformId={state.activePlatformId}
              onSelectPlatform={handleSelectPlatform}
              enabledPlatforms={visiblePlatforms}
              connectedPlatforms={connectedPlatforms}
            />
          )
        })()}
      </div>

      {/* Active card — takes remaining space */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginTop: -1,
        minHeight: 420,
        paddingBottom: 'calc(72px + env(safe-area-inset-bottom))',
      }}>
        {enabledPlatforms.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'var(--font-body)' }}>
            Enable platforms in your project settings to start generating posts.
          </div>
        ) : (
          <ActiveCard
            draft={activeDraft}
            platform={activePlatform}
            onContentChange={handleContentChange}
            onTitleChange={handleTitleChange}
            onTypeChange={handleTypeChange}
            onApprove={handleApprove}
            onRegenerate={handleRegenerate}
            onSkip={handleSkip}
            onDiscardBatch={handleDiscardBatch}
            projectName={state.projectName}
            projectId={activeProjectId ?? undefined}
            onSubredditChange={handleSubredditChange}
            insights={insights}
            userName={userName}
          />
        )}
      </div>

      {showSmartSchedule && (
        <SmartScheduleModal
          drafts={state.drafts}
          enabledPlatforms={selectedPlatforms}
          platforms={PLATFORMS}
          projectName={state.projectName}
          onConfirm={handleSmartScheduleConfirm}
          onClose={() => setShowSmartSchedule(false)}
        />
      )}

      {showPlatformSheet && (
        <PlatformSelectSheet
          enabledPlatforms={enabledPlatforms}
          selectedPlatforms={selectedPlatforms}
          onToggle={handleTogglePlatform}
          onClose={() => setShowPlatformSheet(false)}
        />
      )}
    </div>
  )
}
