import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ComposeState, PlatformId, PostType } from './types'
import { MOCK_DRAFTS, PLATFORM_MAP, PLATFORMS } from './mockData'
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
import type { GenerateResponse, PerformanceInsightDto } from '../../api/types'

const ALL_PLATFORM_IDS: PlatformId[] = ['IG', 'TT', 'LI', 'RD', 'X', 'FB', 'YT', 'ST', 'IT', 'GJ']

// Fallback for when localStorage has no data yet
const PLATFORM_FALLBACKS: Record<string, PlatformId[]> = {
  'DaStu':     ['IG', 'TT', 'LI', 'RD', 'YT'],
  'Sumo Slam': ['IG', 'TT', 'RD', 'X', 'YT', 'ST', 'IT', 'GJ'],
}

interface StoredProject {
  id: string
  name: string
  active: boolean
  platforms: Record<string, { enabled: boolean }>
}

function getStoredProjects(): StoredProject[] {
  try {
    const stored = localStorage.getItem('kontrol_projects')
    if (stored) return JSON.parse(stored) as StoredProject[]
  } catch {}
  return []
}

function getEnabledPlatforms(projectName: string): PlatformId[] {
  try {
    const projects = getStoredProjects()
    const project = projects.find(p => p.name === projectName)
    if (project?.platforms) {
      const enabled = (Object.entries(project.platforms) as [string, { enabled: boolean }][])
        .filter(([, cfg]) => cfg.enabled)
        .map(([id]) => id as PlatformId)
      if (enabled.length > 0) return enabled
    }
  } catch {}
  return PLATFORM_FALLBACKS[projectName] ?? ALL_PLATFORM_IDS
}

function getActiveProjectName(): string {
  try {
    const projects = getStoredProjects()
    const active = projects.find(p => p.active)
    if (active) return active.name
  } catch {}
  return 'DaStu'
}

// ─── Project color helpers ────────────────────────────────────────────────────

const PROJECT_DOT_COLORS: Record<string, string> = {
  'DaStu': '#3B82F6',
  'Sumo Slam': '#1ED760',
}

function getProjectDotColor(name: string): string {
  return PROJECT_DOT_COLORS[name] ?? '#888'
}

// ─── Project Switcher Dropdown ────────────────────────────────────────────────

interface ProjectSwitcherProps {
  currentName: string
  onSwitch: (name: string) => void
}

function ProjectSwitcher({ currentName, onSwitch }: ProjectSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<StoredProject[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Load projects whenever dropdown opens
  useEffect(() => {
    if (open) {
      setProjects(getStoredProjects())
    }
  }, [open])

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
    try {
      const all = getStoredProjects()
      const updated = all.map(p => ({ ...p, active: p.id === proj.id }))
      localStorage.setItem('kontrol_projects', JSON.stringify(updated))
    } catch {}
    onSwitch(proj.name)
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
  onProjectSwitch: (name: string) => void
}

function ComposeTopBar({ projectName, onProjectSwitch }: ComposeTopBarProps) {
  return (
    <div style={{
      height: 48,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
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

      {/* Project switcher pill */}
      <ProjectSwitcher currentName={projectName} onSwitch={onProjectSwitch} />
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
    projectName: getActiveProjectName(),
    prompt: '',
    mediaUrl: null,
    activePlatformId: 'RD',
    drafts: { ...MOCK_DRAFTS },
    generated: true,
  }
}

// ─── Main ComposeScreen ───────────────────────────────────────────────────────

export function ComposeScreen() {
  const isDesktop = useComposeLayout()
  const navigate = useNavigate()

  // projectKey increments whenever the active project changes — forces re-derivation
  const [projectKey, setProjectKey] = useState(0)

  const [state, setState] = useState<ComposeState>(buildInitialState)
  const [generating, setGenerating] = useState(false)
  const [showSmartSchedule, setShowSmartSchedule] = useState(false)
  const [showPlatformSheet, setShowPlatformSheet] = useState(false)
  const [insights, setInsights] = useState<PerformanceInsightDto[] | null>(null)
  const [postPlatformIds, setPostPlatformIds] = useState<Record<string, string>>({})
  const [originalContents, setOriginalContents] = useState<Record<string, string>>({})

  // Re-derive enabled platforms when projectKey or projectName changes
  const enabledPlatforms = getEnabledPlatforms(state.projectName)

  // Per-generation platform selection — defaults to all enabled platforms
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>(enabledPlatforms)

  // Reset when project changes
  useEffect(() => {
    setSelectedPlatforms(getEnabledPlatforms(state.projectName))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.projectName, projectKey])

  const handleProjectSwitch = useCallback((name: string) => {
    setState(prev => ({ ...prev, projectName: name }))
    setProjectKey(k => k + 1)
  }, [])

  const handleTogglePlatform = useCallback((id: PlatformId) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }, [])

  const activePlatform = PLATFORM_MAP[state.activePlatformId]
  const activeDraft = state.drafts[state.activePlatformId]

  const activeProjectId = getStoredProjects().find(p => p.active)?.id ?? null

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

    // Try real API first — fall back to mock on failure
    try {
      const projects = getStoredProjects()
      const active = projects.find(p => p.active)
      if (active?.id && active.id !== 'local') {
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
        return // Success — don't run mock fallback
      }
    } catch {
      // Backend unavailable or project is local-only — fall through to mock behavior
    }

    // Mock fallback
    setInsights([])
    setPostPlatformIds({})
    setOriginalContents({})
    setTimeout(() => {
      setGenerating(false)
      setState(prev => {
        const newDrafts = { ...prev.drafts }
        // Set mock subreddit for RD draft
        if (newDrafts.RD) {
          newDrafts.RD = {
            ...newDrafts.RD,
            subreddit: 'bedroomproducers',
            subredditReasoning: 'Best fit — content matches this vocal production community',
          }
        }
        return { ...prev, drafts: newDrafts, generated: true }
      })
    }, 1800)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.prompt, state.drafts, selectedPlatforms])

  const handleSelectPlatform = useCallback((id: PlatformId) => {
    setState(prev => ({ ...prev, activePlatformId: id }))
  }, [])

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
          <ComposeTopBar projectName={state.projectName} onProjectSwitch={handleProjectSwitch} />

          {/* Input + voice row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <InputBlock
              prompt={state.prompt}
              onPromptChange={p => setState(prev => ({ ...prev, prompt: p }))}
              mediaUrl={state.mediaUrl}
              onMediaDrop={url => setState(prev => ({ ...prev, mediaUrl: url }))}
              desktop
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
      <ComposeTopBar projectName={state.projectName} onProjectSwitch={handleProjectSwitch} />

      {/* Scrollable content above card */}
      <div style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Input + voice row */}
        <div>
          <InputBlock
            prompt={state.prompt}
            onPromptChange={p => setState(prev => ({ ...prev, prompt: p }))}
            mediaUrl={state.mediaUrl}
            onMediaDrop={url => setState(prev => ({ ...prev, mediaUrl: url }))}
          />
          <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px 10px', gap: 8 }}>
            <VoiceInput onTranscript={handleVoiceTranscript} />
          </div>
        </div>

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
            <div style={{ display: 'flex', gap: 5, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>
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

        <ChipStrip
          drafts={state.drafts}
          activePlatformId={state.activePlatformId}
          onSelectPlatform={handleSelectPlatform}
          enabledPlatforms={selectedPlatforms}
        />
      </div>

      {/* Active card — takes remaining space */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginTop: -1,
      }}>
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
        />
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
