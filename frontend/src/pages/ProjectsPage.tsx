import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../components/shared/PageHeader'
import { Toggle } from '../components/shared/Toggle'
import { projectsApi } from '../api/projects'
import { authApi } from '../api/auth'

// ─── Types ───────────────────────────────────────────────────────────────────

type CredentialStatus = 'connected' | 'pending' | 'not_connected'
type PlatformKey = 'IG' | 'TT' | 'LI' | 'RD' | 'X' | 'FB' | 'YT' | 'ST' | 'IT' | 'GJ'

// Task 6: persona_id on PlatformConfig
interface PlatformConfig {
  enabled: boolean
  credentialStatus: CredentialStatus
  persona_id?: string
}

// Task 6: personas array on Project
interface Persona {
  id: string
  name: string
  voice: string
  platforms: string[]
}

interface Project {
  id: string
  name: string
  accent: string
  whatItIs: string
  whoItsFor: string
  vibe: string
  currentStatus: string
  active: boolean
  platforms: Record<PlatformKey, PlatformConfig>
  personas?: Persona[]
  industry?: string
  competitor1?: string
  competitor2?: string
  competitor3?: string
  projectContextText?: string
  contextSource?: string
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const ALL_PLATFORM_KEYS: PlatformKey[] = ['IG', 'TT', 'LI', 'RD', 'X', 'FB', 'YT', 'ST', 'IT', 'GJ']

const PLATFORM_GRADIENTS: Record<PlatformKey, string> = {
  IG: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)',
  TT: 'linear-gradient(135deg, #010101, #69C9D0)',
  LI: 'linear-gradient(135deg, #0A66C2, #0077B5)',
  RD: 'linear-gradient(135deg, #FF4500, #FF6534)',
  X:  'linear-gradient(135deg, #1a1a1a, #333333)',
  FB: 'linear-gradient(135deg, #1877F2, #0C5FCF)',
  YT: 'linear-gradient(135deg, #FF0000, #CC0000)',
  ST: 'linear-gradient(135deg, #1B2838, #2A475E)',
  IT: 'linear-gradient(135deg, #FA5C5C, #E63946)',
  GJ: 'linear-gradient(135deg, #2F7F3E, #45B069)',
}

const PLATFORM_NAMES: Record<PlatformKey, string> = {
  IG: 'Instagram', TT: 'TikTok', LI: 'LinkedIn', RD: 'Reddit',
  X: 'X', FB: 'Facebook', YT: 'YouTube', ST: 'Steam', IT: 'itch.io', GJ: 'Game Jolt',
}

// Task 6: persona_id assignment per platform
const PLATFORM_PERSONA_MAP: Record<PlatformKey, string> = {
  IG: 'personal', TT: 'personal', LI: 'brand', RD: 'personal',
  X: 'personal', FB: 'brand', YT: 'brand', ST: 'brand', IT: 'brand', GJ: 'brand',
}

// Task 6: default personas for all projects
const DEFAULT_PERSONAS: Persona[] = [
  { id: 'personal', name: 'Personal', voice: 'casual', platforms: ['IG', 'TT', 'RD'] },
  { id: 'brand',    name: 'Brand',    voice: 'professional', platforms: ['LI', 'FB', 'YT'] },
]

const DEFAULT_PLATFORMS: Record<PlatformKey, PlatformConfig> = ALL_PLATFORM_KEYS.reduce(
  (acc, k) => ({
    ...acc,
    [k]: {
      enabled: false,
      credentialStatus: 'not_connected' as CredentialStatus,
      persona_id: PLATFORM_PERSONA_MAP[k],
    },
  }),
  {} as Record<PlatformKey, PlatformConfig>
)

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'dastu',
    name: 'DaStu',
    accent: 'linear-gradient(135deg, #FF4500, #FF6534)',
    whatItIs: 'AI vocal studio for bedroom musicians',
    whoItsFor: 'Bedroom rappers & R´B singers on phones',
    vibe: 'Raw, real, built by someone who makes music',
    currentStatus: 'Sprint 1 — building Python audio microservice',
    active: true,
    personas: DEFAULT_PERSONAS,
    platforms: {
      IG: { enabled: true,  credentialStatus: 'connected',     persona_id: 'personal' },
      TT: { enabled: true,  credentialStatus: 'pending',       persona_id: 'personal' },
      LI: { enabled: true,  credentialStatus: 'connected',     persona_id: 'brand' },
      RD: { enabled: true,  credentialStatus: 'connected',     persona_id: 'personal' },
      X:  { enabled: false, credentialStatus: 'not_connected', persona_id: 'personal' },
      FB: { enabled: false, credentialStatus: 'not_connected', persona_id: 'brand' },
      YT: { enabled: true,  credentialStatus: 'not_connected', persona_id: 'brand' },
      ST: { enabled: false, credentialStatus: 'not_connected', persona_id: 'brand' },
      IT: { enabled: false, credentialStatus: 'not_connected', persona_id: 'brand' },
      GJ: { enabled: false, credentialStatus: 'not_connected', persona_id: 'brand' },
    },
  },
  {
    id: 'sumo-slam',
    name: 'Sumo Slam',
    accent: 'linear-gradient(135deg, #1B2838, #2A475E)',
    whatItIs: 'Arcade party brawler going to Steam/Switch/itch.io',
    whoItsFor: 'Party gamers, indie game fans',
    vibe: 'Fun, chaotic, Nintendo-polish quality bar',
    currentStatus: 'Art production phase, 12 character roster finalized',
    active: false,
    personas: DEFAULT_PERSONAS,
    platforms: {
      IG: { enabled: true,  credentialStatus: 'connected',     persona_id: 'personal' },
      TT: { enabled: true,  credentialStatus: 'pending',       persona_id: 'personal' },
      LI: { enabled: false, credentialStatus: 'not_connected', persona_id: 'brand' },
      RD: { enabled: true,  credentialStatus: 'connected',     persona_id: 'personal' },
      X:  { enabled: true,  credentialStatus: 'not_connected', persona_id: 'personal' },
      FB: { enabled: false, credentialStatus: 'not_connected', persona_id: 'brand' },
      YT: { enabled: true,  credentialStatus: 'not_connected', persona_id: 'brand' },
      ST: { enabled: true,  credentialStatus: 'pending',       persona_id: 'brand' },
      IT: { enabled: true,  credentialStatus: 'connected',     persona_id: 'brand' },
      GJ: { enabled: true,  credentialStatus: 'not_connected', persona_id: 'brand' },
    },
  },
]

// Task 6: merge personas into existing projects if missing
function mergePersonasIfAbsent(projects: Project[]): Project[] {
  return projects.map(p => {
    const needsPersonas = !p.personas || p.personas.length === 0
    const needsPersonaIds = ALL_PLATFORM_KEYS.some(k => !p.platforms[k]?.persona_id)
    if (!needsPersonas && !needsPersonaIds) return p

    const updatedPlatforms = { ...p.platforms } as Record<PlatformKey, PlatformConfig>
    if (needsPersonaIds) {
      for (const k of ALL_PLATFORM_KEYS) {
        if (!updatedPlatforms[k]?.persona_id) {
          updatedPlatforms[k] = {
            ...updatedPlatforms[k],
            persona_id: PLATFORM_PERSONA_MAP[k],
          }
        }
      }
    }
    return {
      ...p,
      personas: needsPersonas ? DEFAULT_PERSONAS : p.personas,
      platforms: updatedPlatforms,
    }
  })
}

// ─── Upload helper ────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

/** Upload a single file to the context-document endpoint. */
async function uploadSingleDocument(
  projectId: string,
  file: File
): Promise<{ characters: number }> {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await fetch(
    `${BASE_URL}/api/v1/projects/${projectId}/context-document`,
    { method: 'POST', body: formData }
  )
  return resp.json() as Promise<{ characters: number }>
}

/** Upload multiple files one at a time, returns aggregated character count. */
async function uploadDocuments(
  projectId: string,
  files: File[]
): Promise<{ characters: number }> {
  let total = 0
  for (const file of files) {
    const result = await uploadSingleDocument(projectId, file)
    total += result.characters ?? 0
  }
  return { characters: total }
}

/** Save free-text context to the context-text endpoint. */
async function saveContextText(
  projectId: string,
  text: string
): Promise<void> {
  await fetch(
    `${BASE_URL}/api/v1/projects/${projectId}/context-text`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CredBadge({
  status,
  platform,
  onConnectInSettings,
}: {
  status: CredentialStatus
  platform: PlatformKey
  onConnectInSettings: () => void
}) {
  if (status === 'connected') {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1ED760', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Connected</span>
      </span>
    )
  }
  if (status === 'pending') {
    const hasDeveloperNote = platform === 'TT' || platform === 'ST'
    return (
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#F59E0B', fontFamily: 'var(--font-mono)' }}>Pending approval</span>
        </span>
        {hasDeveloperNote && (
          <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginLeft: 12, cursor: 'pointer' }}>
            {platform === 'TT' ? 'Apply at TikTok for Developers →' : 'Apply at Steamworks →'}
          </span>
        )}
      </span>
    )
  }
  // not_connected
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', flexShrink: 0 }} />
      <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Not connected —</span>
      <button
        onClick={onConnectInSettings}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          cursor: 'pointer',
          padding: 0,
          textDecoration: 'underline',
        }}
      >
        connect in Settings →
      </button>
    </span>
  )
}

function PlatformDot({ platformKey, enabled }: { platformKey: PlatformKey; enabled: boolean }) {
  return (
    <span
      title={PLATFORM_NAMES[platformKey]}
      style={{
        width: 22,
        height: 22,
        borderRadius: 999,
        background: PLATFORM_GRADIENTS[platformKey],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 9,
        fontFamily: 'var(--font-mono)',
        fontWeight: 700,
        color: '#fff',
        opacity: enabled ? 1 : 0.25,
        flexShrink: 0,
      }}
    >
      {platformKey}
    </span>
  )
}

function InputField({
  label, value, onChange, multiline = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
}) {
  const base: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-raised)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '10px 12px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    outline: 'none',
    resize: 'none' as const,
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          rows={2}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={base}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          style={base}
        />
      )}
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  const [angle, setAngle] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setAngle(a => (a + 30) % 360), 80)
    return () => clearInterval(id)
  }, [])
  return (
    <span style={{
      display: 'inline-block',
      transform: `rotate(${angle}deg)`,
      fontSize: 14,
      lineHeight: 1,
      color: 'var(--text-muted)',
    }}>
      &#8635;
    </span>
  )
}

// ─── ContextUploadZone ────────────────────────────────────────────────────────

interface ContextUploadZoneProps {
  /** If provided, uploads happen immediately to this ID. If null, files are held in state. */
  projectId: string | null
  /** Called when files are selected/changed (for deferred upload in new-project flow). */
  onFilesChange?: (files: File[]) => void
  /** Notify parent of successful upload result */
  onUploadSuccess?: (result: { characters: number }) => void
}

function ContextUploadZone({ projectId, onFilesChange, onUploadSuccess }: ContextUploadZoneProps) {
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ characters: number } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_FILES = 5
  const ACCEPT = '.pdf,.docx,.txt,.csv'

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return
    const arr = Array.from(incoming)
    setFiles(prev => {
      const merged = [...prev]
      for (const f of arr) {
        if (merged.length >= MAX_FILES) break
        if (!merged.find(x => x.name === f.name && x.size === f.size)) {
          merged.push(f)
        }
      }
      const next = merged.slice(0, MAX_FILES)
      onFilesChange?.(next)
      return next
    })
    // Reset status when new files are added
    setUploadResult(null)
    setUploadError(null)
  }

  const removeFile = (index: number) => {
    setFiles(prev => {
      const next = prev.filter((_, i) => i !== index)
      onFilesChange?.(next)
      return next
    })
    setUploadResult(null)
    setUploadError(null)
  }

  const handleExtract = async () => {
    if (!projectId || files.length === 0 || uploading) return
    setUploading(true)
    setUploadError(null)
    try {
      let total = 0
      for (const file of files) {
        const result = await uploadSingleDocument(projectId, file)
        total += result.characters ?? 0
      }
      const aggregated = { characters: total }
      setUploadResult(aggregated)
      onUploadSuccess?.(aggregated)
    } catch {
      setUploadError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const dropZoneStyle: React.CSSProperties = {
    border: `1.5px dashed ${dragging ? '#3B82F6' : '#333'}`,
    borderRadius: 10,
    padding: 20,
    background: dragging ? '#0d1a2e' : '#111',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.15s, background 0.15s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Drop zone */}
      <div
        style={dropZoneStyle}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setDragging(false)
          addFiles(e.dataTransfer.files)
        }}
      >
        <div style={{ fontSize: 22, marginBottom: 6, lineHeight: 1 }}>&#128196;</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>
          Drag files here or tap to upload
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
          PDF, DOCX, TXT, CSV &middot; Up to 5 files &middot; 10MB each
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          style={{ display: 'none' }}
          onChange={e => { addFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map((f, i) => (
            <div
              key={`${f.name}-${f.size}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#111',
                borderRadius: 8,
                padding: '7px 10px',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1, flexShrink: 0 }}>&#128196;</span>
              <span style={{
                flex: 1,
                fontSize: 12,
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {f.name}
              </span>
              <button
                onClick={e => { e.stopPropagation(); removeFile(i) }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: '0 4px',
                  lineHeight: 1,
                  flexShrink: 0,
                }}
                aria-label={`Remove ${f.name}`}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Extract button — only shown when there is a projectId (edit mode) */}
      {projectId && files.length > 0 && !uploadResult && (
        <button
          onClick={handleExtract}
          disabled={uploading}
          style={{
            width: '100%',
            padding: '10px 0',
            background: uploading ? 'rgba(59,130,246,0.4)' : '#3B82F6',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            borderRadius: 10,
            cursor: uploading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {uploading ? (
            <>
              <Spinner />
              Processing...
            </>
          ) : (
            `Upload ${files.length} file${files.length !== 1 ? 's' : ''}`
          )}
        </button>
      )}

      {/* New-project deferred info — no projectId yet */}
      {!projectId && files.length > 0 && (
        <div style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          padding: '6px 10px',
          background: 'rgba(59,130,246,0.08)',
          borderRadius: 8,
          border: '1px solid rgba(59,130,246,0.18)',
        }}>
          {files.length} file{files.length !== 1 ? 's' : ''} queued &mdash; will be extracted after project is created
        </div>
      )}

      {/* Upload result */}
      {uploadResult && (
        <div style={{
          fontSize: 12,
          color: '#1ED760',
          fontFamily: 'var(--font-mono)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          background: 'rgba(30,215,96,0.08)',
          borderRadius: 8,
          border: '1px solid rgba(30,215,96,0.2)',
        }}>
          <span>&#10003;</span>
          Context loaded &mdash; {uploadResult.characters.toLocaleString()} characters extracted
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div style={{
          fontSize: 12,
          color: '#EF4444',
          fontFamily: 'var(--font-mono)',
          padding: '6px 10px',
          background: 'rgba(239,68,68,0.08)',
          borderRadius: 8,
          border: '1px solid rgba(239,68,68,0.2)',
        }}>
          {uploadError}
        </div>
      )}
    </div>
  )
}

// ─── ContextTabsSection ───────────────────────────────────────────────────────

type ContextTab = 'paste' | 'upload'

interface ContextTabsSectionProps {
  /** The current saved/draft text value */
  contextText: string
  /** Called when the user edits the textarea */
  onContextTextChange: (val: string) => void
  /** The original saved value — used to decide whether Save button is enabled */
  savedContextText?: string
  /** If provided, Save button fires PUT and Upload button fires POST immediately.
   *  If null, all changes are held in local state (new-project flow). */
  projectId: string | null
  /** Called when files are selected (for deferred upload in new-project flow) */
  onFilesChange?: (files: File[]) => void
  /** Called after a successful document upload */
  onUploadSuccess?: (result: { characters: number }) => void
  /** Called after the Save context text button succeeds (edit flow only) */
  onContextTextSaved?: () => void
}

function ContextTabsSection({
  contextText,
  onContextTextChange,
  savedContextText,
  projectId,
  onFilesChange,
  onUploadSuccess,
  onContextTextSaved,
}: ContextTabsSectionProps) {
  const [activeTab, setActiveTab] = useState<ContextTab>('paste')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedOk, setSavedOk] = useState(false)

  // Button is disabled when text is empty or unchanged from saved value
  const isTextEmpty = contextText.trim() === ''
  const isUnchanged = savedContextText !== undefined && contextText === savedContextText
  const saveDisabled = isTextEmpty || isUnchanged || saving

  const handleSaveText = async () => {
    if (!projectId || saveDisabled) return
    setSaving(true)
    setSaveError(null)
    setSavedOk(false)
    try {
      await saveContextText(projectId, contextText)
      setSavedOk(true)
      onContextTextSaved?.()
    } catch {
      setSaveError('Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Pill styles
  const pillBase: React.CSSProperties = {
    padding: '8px 16px',
    borderRadius: 8,
    fontSize: 13,
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    lineHeight: 1,
    transition: 'background 0.12s, color 0.12s',
  }
  const pillActive: React.CSSProperties = {
    ...pillBase,
    background: '#3B82F6',
    color: '#fff',
  }
  const pillInactive: React.CSSProperties = {
    ...pillBase,
    background: '#222',
    color: '#fff',
    border: '1px solid #333',
  }

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    background: '#111',
    border: '1px solid #333',
    borderRadius: 10,
    padding: '10px 12px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
    minHeight: 140,
    boxSizing: 'border-box',
  }

  const saveButtonStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 0',
    background: '#3B82F6',
    color: '#fff',
    fontFamily: 'var(--font-body)',
    fontSize: 13,
    fontWeight: 700,
    border: 'none',
    borderRadius: 10,
    cursor: saveDisabled ? 'not-allowed' : 'pointer',
    opacity: saveDisabled ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'opacity 0.12s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Section heading */}
      <div style={{
        fontSize: 11,
        color: '#555',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
      }}>
        Project Context
      </div>

      {/* Tab pills */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          style={activeTab === 'paste' ? pillActive : pillInactive}
          onClick={() => setActiveTab('paste')}
        >
          Paste text
        </button>
        <button
          style={activeTab === 'upload' ? pillActive : pillInactive}
          onClick={() => setActiveTab('upload')}
        >
          Upload documents
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'paste' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <textarea
            rows={7}
            value={contextText}
            onChange={e => {
              onContextTextChange(e.target.value)
              setSavedOk(false)
            }}
            placeholder="Describe your business, paste brand guidelines, mission statement, product descriptions, or any context Claude should know about this project."
            style={textareaStyle}
          />
          {/* Save button — only shown in edit mode (projectId exists) */}
          {projectId && (
            <button
              onClick={handleSaveText}
              disabled={saveDisabled}
              style={saveButtonStyle}
            >
              {saving ? (
                <>
                  <Spinner />
                  Saving...
                </>
              ) : savedOk ? (
                <span style={{ color: '#1ED760' }}>&#10003; Saved</span>
              ) : (
                'Save context'
              )}
            </button>
          )}
          {saveError && (
            <div style={{
              fontSize: 12,
              color: '#EF4444',
              fontFamily: 'var(--font-mono)',
              padding: '6px 10px',
              background: 'rgba(239,68,68,0.08)',
              borderRadius: 8,
              border: '1px solid rgba(239,68,68,0.2)',
            }}>
              {saveError}
            </div>
          )}
        </div>
      )}

      {activeTab === 'upload' && (
        <ContextUploadZone
          projectId={projectId}
          onFilesChange={onFilesChange}
          onUploadSuccess={onUploadSuccess}
        />
      )}

      {/* Summary line — only when contextText has content */}
      {contextText.trim() !== '' && (
        <div style={{
          fontSize: 13,
          color: '#888',
          fontFamily: 'var(--font-body)',
          marginTop: 4,
        }}>
          &#128196; Project context loaded &mdash; Claude will use this when generating posts for this project.
        </div>
      )}
    </div>
  )
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider() {
  return <div style={{ height: 1, background: '#222', margin: '4px 0' }} />
}

// ─── Edit Panel ───────────────────────────────────────────────────────────────

interface EditPanelProps {
  project: Project
  onSave: (updated: Project) => void
  onCancel: () => void
  onConnectInSettings: () => void
}

const VOICE_OPTIONS = ['casual', 'professional', 'playful', 'educational', 'raw']

const PERSONA_DOT_COLORS: Record<string, string> = {
  personal: '#3B82F6',
  brand: '#1ED760',
}

function EditPanel({ project, onSave, onCancel, onConnectInSettings }: EditPanelProps) {
  const [form, setForm] = useState({ ...project })

  const setField = (key: keyof Project, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  const togglePlatform = (pk: PlatformKey) => {
    setForm(f => ({
      ...f,
      platforms: {
        ...f.platforms,
        [pk]: { ...f.platforms[pk], enabled: !f.platforms[pk].enabled },
      },
    }))
  }

  const updatePersonaField = (personaId: string, field: 'name' | 'voice', value: string) => {
    setForm(f => ({
      ...f,
      personas: (f.personas ?? []).map(p =>
        p.id === personaId ? { ...p, [field]: value } : p
      ),
    }))
  }

  const updatePlatformPersona = (pk: PlatformKey, personaId: string) => {
    setForm(f => ({
      ...f,
      platforms: {
        ...f.platforms,
        [pk]: { ...f.platforms[pk], persona_id: personaId },
      },
    }))
  }

  const selectStyle: React.CSSProperties = {
    background: 'var(--bg-active)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: '4px 8px',
    cursor: 'pointer',
    outline: 'none',
  }

  const personas = form.personas ?? []
  const enabledPlatforms = ALL_PLATFORM_KEYS.filter(pk => form.platforms[pk]?.enabled)

  return (
    <div style={{
      marginTop: 16,
      borderTop: '1px solid rgba(255,255,255,0.07)',
      paddingTop: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      <InputField label="Name" value={form.name} onChange={v => setField('name', v)} />
      <InputField label="What it is" value={form.whatItIs} onChange={v => setField('whatItIs', v)} multiline />
      <InputField label="Who it's for" value={form.whoItsFor} onChange={v => setField('whoItsFor', v)} multiline />
      <InputField label="Vibe" value={form.vibe} onChange={v => setField('vibe', v)} multiline />
      <InputField label="Current status" value={form.currentStatus} onChange={v => setField('currentStatus', v)} />
      <InputField label="Industry" value={form.industry ?? ''} onChange={v => setField('industry', v)} />

      {/* Competitors section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Competitors (optional)
          </label>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
            Add up to 3 competitors by name or URL
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(['competitor1', 'competitor2', 'competitor3'] as const).map((key, i) => (
            <input
              key={key}
              type="text"
              value={form[key] ?? ''}
              onChange={e => setField(key, e.target.value)}
              placeholder={`Competitor ${i + 1} name or URL`}
              style={{
                width: '100%',
                background: 'var(--bg-raised)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box' as const,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Project Context section ── */}
      <ContextTabsSection
        contextText={form.projectContextText ?? ''}
        onContextTextChange={val => {
          setField('projectContextText', val)
          if (val.trim()) {
            setForm(f => ({
              ...f,
              contextSource: f.contextSource === 'url' || f.contextSource === 'document' || f.contextSource === 'mixed'
                ? 'mixed'
                : 'manual',
            }))
          }
        }}
        savedContextText={project.projectContextText ?? ''}
        projectId={project.id}
        onUploadSuccess={result => {
          setForm(f => ({
            ...f,
            contextSource: f.contextSource && f.contextSource !== 'url'
              ? 'mixed'
              : f.contextSource === 'url' ? 'mixed' : 'document',
          }))
          void result
        }}
        onContextTextSaved={() => {
          setForm(f => ({
            ...f,
            contextSource: f.contextSource === 'url' || f.contextSource === 'document' || f.contextSource === 'mixed'
              ? 'mixed'
              : 'manual',
          }))
        }}
      />

      {/* Platform toggles */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          Platforms
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ALL_PLATFORM_KEYS.map(pk => {
            const cfg = form.platforms[pk]
            return (
              <div key={pk} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* Swatch */}
                <span style={{
                  width: 28, height: 28, borderRadius: 8, background: PLATFORM_GRADIENTS[pk],
                  flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff',
                }}>
                  {pk}
                </span>
                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
                    {PLATFORM_NAMES[pk]}
                  </div>
                  {cfg.enabled && <CredBadge status={cfg.credentialStatus} platform={pk} onConnectInSettings={onConnectInSettings} />}
                </div>
                {/* Toggle */}
                <Toggle checked={cfg.enabled} onChange={() => togglePlatform(pk)} />
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Personas section ── */}
      <div style={{ marginTop: 6 }}>
        <div style={{
          fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
        }}>
          Personas
        </div>

        {/* Persona cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {personas.map(persona => (
            <div key={persona.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--bg-raised)', borderRadius: 10, padding: '10px 12px',
            }}>
              {/* Color dot */}
              <span style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: PERSONA_DOT_COLORS[persona.id] ?? '#888',
              }} />
              {/* Name input */}
              <input
                type="text"
                value={persona.name}
                onChange={e => updatePersonaField(persona.id, 'name', e.target.value)}
                style={{
                  flex: 1,
                  fontSize: 13,
                  background: 'var(--bg-active)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                }}
              />
              {/* Voice dropdown */}
              <select
                value={persona.voice}
                onChange={e => updatePersonaField(persona.id, 'voice', e.target.value)}
                style={selectStyle}
              >
                {VOICE_OPTIONS.map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Per-platform persona assignment */}
        {enabledPlatforms.length > 0 && (
          <div>
            <div style={{
              fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
            }}>
              Platform persona
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {enabledPlatforms.map(pk => {
                const currentPersonaId = form.platforms[pk]?.persona_id ?? 'personal'
                return (
                  <div key={pk} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Platform gradient circle */}
                    <span style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: PLATFORM_GRADIENTS[pk],
                      flexShrink: 0,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 8, fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#fff',
                    }}>
                      {pk}
                    </span>
                    <span style={{
                      flex: 1, fontSize: 12, color: 'var(--text-secondary)',
                      fontFamily: 'var(--font-body)',
                    }}>
                      {PLATFORM_NAMES[pk]}
                    </span>
                    <select
                      value={currentPersonaId}
                      onChange={e => updatePlatformPersona(pk, e.target.value)}
                      style={selectStyle}
                    >
                      {personas.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <button
        onClick={() => onSave(form)}
        style={{
          width: '100%',
          padding: '12px 0',
          background: 'var(--accent)',
          color: '#fff',
          fontFamily: 'var(--font-body)',
          fontSize: 15,
          fontWeight: 700,
          border: 'none',
          borderRadius: 'var(--radius-button)',
          cursor: 'pointer',
        }}
      >
        Save Changes
      </button>
      <button
        onClick={onCancel}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          cursor: 'pointer',
          textAlign: 'center',
          padding: '4px 0',
        }}
      >
        Cancel
      </button>
    </div>
  )
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({
  project, onSetActive, onSave, onConnectInSettings,
}: {
  project: Project
  onSetActive: (id: string) => void
  onSave: (updated: Project) => void
  onConnectInSettings: () => void
}) {
  const [editing, setEditing] = useState(false)

  const handleSave = (updated: Project) => {
    onSave(updated)
    setEditing(false)
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-card)',
      padding: 20,
      marginBottom: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      {/* Row 1: swatch + name + active badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{
          width: 28, height: 28, borderRadius: 8, background: project.accent, flexShrink: 0,
        }} />
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
          {project.name}
        </span>
        {project.active && (
          <span style={{
            background: 'rgba(30,215,96,0.12)',
            border: '1px solid rgba(30,215,96,0.35)',
            color: '#1ED760',
            fontSize: 10,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            padding: '2px 8px',
            borderRadius: 999,
            letterSpacing: 0.5,
          }}>
            ACTIVE
          </span>
        )}
      </div>

      {/* Row 2: what it is */}
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', marginBottom: 6, lineHeight: 1.4 }}>
        {project.whatItIs}
      </p>

      {/* Row 3: current status mono */}
      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
        &bull; {project.currentStatus}
      </p>

      {/* Row 4: platform dots */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14 }}>
        {ALL_PLATFORM_KEYS.map(pk => (
          <PlatformDot key={pk} platformKey={pk} enabled={project.platforms[pk].enabled} />
        ))}
      </div>

      {/* Row 5: actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setEditing(e => !e)}
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-button)',
            border: '1px solid rgba(255,255,255,0.12)',
            background: 'none',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {editing ? 'Close' : 'Edit'}
        </button>
        <button
          onClick={() => !project.active && onSetActive(project.id)}
          disabled={project.active}
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-button)',
            border: project.active ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(255,255,255,0.12)',
            background: 'none',
            color: project.active ? 'var(--text-muted)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            cursor: project.active ? 'default' : 'pointer',
            opacity: project.active ? 0.5 : 1,
          }}
        >
          {project.active ? 'Active' : 'Set Active'}
        </button>
      </div>

      {/* Edit panel (inline toggle) */}
      {editing && (
        <EditPanel
          project={project}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          onConnectInSettings={onConnectInSettings}
        />
      )}
    </div>
  )
}

// ─── New Project Form ─────────────────────────────────────────────────────────

interface NewProjectFormProps {
  onCreate: (p: Project, uploadFiles: File[]) => void
  onCancel: () => void
}

function NewProjectForm({ onCreate, onCancel }: NewProjectFormProps) {
  const [name, setName] = useState('')
  const [whatItIs, setWhatItIs] = useState('')
  const [whoItsFor, setWhoItsFor] = useState('')
  const [vibe, setVibe] = useState('')
  const [currentStatus, setCurrentStatus] = useState('')
  const [industry, setIndustry] = useState('')
  const [competitor1, setCompetitor1] = useState('')
  const [competitor2, setCompetitor2] = useState('')
  const [competitor3, setCompetitor3] = useState('')

  // URL analysis state
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [aiSuggested, setAiSuggested] = useState<Set<string>>(new Set())

  // Context state
  const [projectContextText, setProjectContextText] = useState('')
  const [contextSource, setContextSource] = useState<string>('')
  const [uploadFiles, setUploadFiles] = useState<File[]>([])

  // Derive contextSource based on which inputs are populated
  const computeContextSource = (
    hasUrl: boolean,
    hasFiles: boolean,
    hasText: boolean
  ): string => {
    const count = [hasUrl, hasFiles, hasText].filter(Boolean).length
    if (count === 0) return ''
    if (count > 1) return 'mixed'
    if (hasUrl) return 'url'
    if (hasFiles) return 'document'
    return 'manual'
  }

  const handleAnalyze = async () => {
    if (!websiteUrl.trim() || analyzing) return
    setAnalyzing(true)
    try {
      const res = await authApi.analyzeUrl(websiteUrl.trim())
      const suggested = new Set<string>()

      if (res.name) { setName(res.name); suggested.add('name') }
      if (res.what_it_is) { setWhatItIs(res.what_it_is); suggested.add('whatItIs') }
      if (res.who_its_for) { setWhoItsFor(res.who_its_for); suggested.add('whoItsFor') }
      if (res.vibe) { setVibe(res.vibe); suggested.add('vibe') }
      if (res.industry) { setIndustry(res.industry); suggested.add('industry') }
      if (res.competitors) {
        const parts: string[] = Array.isArray(res.competitors)
          ? res.competitors
          : res.competitors.split(',').map((s: string) => s.trim()).filter(Boolean)
        if (parts[0]) { setCompetitor1(parts[0]); suggested.add('competitor1') }
        if (parts[1]) { setCompetitor2(parts[1]); suggested.add('competitor2') }
        if (parts[2]) { setCompetitor3(parts[2]); suggested.add('competitor3') }
      }

      setAiSuggested(suggested)
      setContextSource(computeContextSource(true, uploadFiles.length > 0, projectContextText.trim().length > 0))
    } catch {
      // Silently ignore — backend may be offline
    } finally {
      setAnalyzing(false)
    }
  }

  const clearSuggested = (field: string) => {
    setAiSuggested(prev => {
      const next = new Set(prev)
      next.delete(field)
      return next
    })
  }

  const handleFilesChange = (files: File[]) => {
    setUploadFiles(files)
    setContextSource(computeContextSource(!!websiteUrl.trim(), files.length > 0, projectContextText.trim().length > 0))
  }

  const handleContextTextChange = (val: string) => {
    setProjectContextText(val)
    setContextSource(computeContextSource(!!websiteUrl.trim(), uploadFiles.length > 0, val.trim().length > 0))
  }

  const handleCreate = () => {
    if (!name.trim()) return
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: name.trim(),
      accent: 'linear-gradient(135deg, #3B82F6, #6366F1)',
      whatItIs,
      whoItsFor,
      vibe,
      currentStatus,
      active: false,
      personas: DEFAULT_PERSONAS,
      platforms: { ...DEFAULT_PLATFORMS },
      industry: industry.trim() || undefined,
      competitor1: competitor1.trim() || undefined,
      competitor2: competitor2.trim() || undefined,
      competitor3: competitor3.trim() || undefined,
      projectContextText: projectContextText.trim() || undefined,
      contextSource: contextSource || undefined,
    }
    onCreate(newProject, uploadFiles)
  }

  const AiLabel = ({ field }: { field: string }) =>
    aiSuggested.has(field) ? (
      <div style={{
        fontSize: 11,
        color: '#3B82F6',
        fontFamily: 'var(--font-body)',
        marginTop: 3,
      }}>
        AI suggested — review and edit
      </div>
    ) : null

  const inputBase: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-raised)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '10px 12px',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: 14,
    outline: 'none',
    resize: 'none' as const,
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-card)',
      padding: 20,
      marginBottom: 12,
      boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
      border: '1px solid rgba(59,130,246,0.25)',
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, fontFamily: 'var(--font-body)' }}>
        New Project
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── PROJECT CONTEXT section ── */}
        <div style={{
          background: 'var(--bg-raised)',
          borderRadius: 10,
          padding: '12px 14px',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          {/* Website URL — Method 1 (always shown in new-project flow) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}>
              Learn from a website{' '}
              <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="url"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                placeholder="Paste your website URL..."
                onKeyDown={e => { if (e.key === 'Enter') handleAnalyze() }}
                style={{
                  ...inputBase,
                  flex: 1,
                  fontSize: 13,
                  padding: '9px 11px',
                }}
              />
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !websiteUrl.trim()}
                style={{
                  flexShrink: 0,
                  padding: '9px 14px',
                  background: analyzing || !websiteUrl.trim() ? 'rgba(59,130,246,0.3)' : '#3B82F6',
                  border: 'none',
                  borderRadius: 10,
                  color: '#fff',
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: analyzing || !websiteUrl.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                {analyzing && <Spinner />}
                {analyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </div>

          <SectionDivider />

          {/* Tabbed context: Paste text / Upload documents */}
          <ContextTabsSection
            contextText={projectContextText}
            onContextTextChange={handleContextTextChange}
            projectId={null}
            onFilesChange={handleFilesChange}
          />
        </div>

        {/* ── Fields ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); clearSuggested('name') }}
            style={inputBase}
          />
          <AiLabel field="name" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            What it is
          </label>
          <textarea
            rows={2}
            value={whatItIs}
            onChange={e => { setWhatItIs(e.target.value); clearSuggested('whatItIs') }}
            style={inputBase}
          />
          <AiLabel field="whatItIs" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Who it&apos;s for
          </label>
          <textarea
            rows={2}
            value={whoItsFor}
            onChange={e => { setWhoItsFor(e.target.value); clearSuggested('whoItsFor') }}
            style={inputBase}
          />
          <AiLabel field="whoItsFor" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Vibe
          </label>
          <textarea
            rows={2}
            value={vibe}
            onChange={e => { setVibe(e.target.value); clearSuggested('vibe') }}
            style={inputBase}
          />
          <AiLabel field="vibe" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Current status
          </label>
          <input
            type="text"
            value={currentStatus}
            onChange={e => setCurrentStatus(e.target.value)}
            style={inputBase}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Industry
          </label>
          <input
            type="text"
            value={industry}
            onChange={e => { setIndustry(e.target.value); clearSuggested('industry') }}
            placeholder="e.g. Indie game development, AI music tools, B2B SaaS"
            style={inputBase}
          />
          <AiLabel field="industry" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Competitors (optional)
            </label>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>
              Add up to 3 competitors by name or URL
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <input
                type="text"
                value={competitor1}
                onChange={e => { setCompetitor1(e.target.value); clearSuggested('competitor1') }}
                placeholder="Competitor 1 name or URL"
                style={inputBase}
              />
              <AiLabel field="competitor1" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <input
                type="text"
                value={competitor2}
                onChange={e => { setCompetitor2(e.target.value); clearSuggested('competitor2') }}
                placeholder="Competitor 2 name or URL"
                style={inputBase}
              />
              <AiLabel field="competitor2" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <input
                type="text"
                value={competitor3}
                onChange={e => { setCompetitor3(e.target.value); clearSuggested('competitor3') }}
                placeholder="Competitor 3 name or URL"
                style={inputBase}
              />
              <AiLabel field="competitor3" />
            </div>
          </div>
        </div>

        <button
          onClick={handleCreate}
          style={{
            width: '100%',
            padding: '12px 0',
            background: 'var(--accent)',
            color: '#fff',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            fontWeight: 700,
            border: 'none',
            borderRadius: 'var(--radius-button)',
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          Create Project
        </button>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            cursor: 'pointer',
            textAlign: 'center',
            padding: '4px 0',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Narrow hook ─────────────────────────────────────────────────────────────

function useIsNarrow() {
  const [narrow, setNarrow] = useState(window.innerWidth < 480)
  useEffect(() => {
    function onResize() { setNarrow(window.innerWidth < 480) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return narrow
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function DEFAULT_PROJECT_FROM_API(ap: { id: string; name: string; whatItIs?: string | null; whoItsFor?: string | null; vibe?: string | null; currentStatus?: string | null; active: boolean }): Project {
  return {
    id: ap.id,
    name: ap.name,
    accent: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    whatItIs: ap.whatItIs ?? '',
    whoItsFor: ap.whoItsFor ?? '',
    vibe: ap.vibe ?? '',
    currentStatus: ap.currentStatus ?? '',
    active: ap.active,
    personas: DEFAULT_PERSONAS,
    platforms: { ...DEFAULT_PLATFORMS },
  }
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const isNarrow = useIsNarrow()

  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS)
  const [showNewForm, setShowNewForm] = useState(false)

  // Load exclusively from API on mount
  useEffect(() => {
    projectsApi.list()
      .then(apiProjects => {
        if (apiProjects.length > 0) {
          const mapped = apiProjects.map(ap => DEFAULT_PROJECT_FROM_API(ap))
          setProjects(mergePersonasIfAbsent(mapped))
        }
      })
      .catch(() => {
        // Backend offline — keep seed data shown as placeholder
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSetActive = async (id: string) => {
    setProjects(ps => ps.map(p => ({ ...p, active: p.id === id })))
    try {
      await projectsApi.activate(id)
    } catch {
      // best-effort
    }
    navigate('/compose')
  }

  const handleSave = useCallback((updated: Project) => {
    setProjects(ps => ps.map(p => p.id === updated.id ? updated : p))
    // Fire and forget API update
    projectsApi.update(updated.id, {
      name: updated.name,
      whatItIs: updated.whatItIs,
      whoItsFor: updated.whoItsFor,
      vibe: updated.vibe,
      currentStatus: updated.currentStatus,
    }).catch(() => {})
  }, [])

  const handleCreate = useCallback((newProject: Project, pendingFiles: File[]) => {
    // Try to create via API and use the returned ID
    projectsApi.create({
      name: newProject.name,
      whatItIs: newProject.whatItIs,
      whoItsFor: newProject.whoItsFor,
      vibe: newProject.vibe,
      currentStatus: newProject.currentStatus,
    }).then(async created => {
      const projectWithId = { ...newProject, id: created.id }
      setProjects(ps => [...ps, projectWithId])
      // Upload queued files now that we have a real project ID
      if (pendingFiles.length > 0) {
        try {
          await uploadDocuments(created.id, pendingFiles)
        } catch {
          // Non-fatal — context upload failure should not block project creation
        }
      }
    }).catch(() => {
      // Fall back to local ID
      setProjects(ps => [...ps, newProject])
    })
    setShowNewForm(false)
  }, [])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-base)' }}>
      <PageHeader
        title="Projects"
        rightSlot={
          isNarrow ? (
            <button
              onClick={() => setShowNewForm(s => !s)}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                fontFamily: 'var(--font-body)',
                fontSize: 20,
                fontWeight: 400,
                lineHeight: 1,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="New Project"
            >
              +
            </button>
          ) : (
            <button
              onClick={() => setShowNewForm(s => !s)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 14px',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              + New Project
            </button>
          )
        }
      />

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 32px' }}>
        {showNewForm && (
          <NewProjectForm
            onCreate={handleCreate}
            onCancel={() => setShowNewForm(false)}
          />
        )}

        {projects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            onSetActive={handleSetActive}
            onSave={handleSave}
            onConnectInSettings={() => navigate('/settings')}
          />
        ))}
      </div>
    </div>
  )
}

// FRONTEND-AGENT: ProjectsPage complete (context upload + free-text context)
