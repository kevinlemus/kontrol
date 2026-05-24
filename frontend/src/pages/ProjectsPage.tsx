import React, { useState, useEffect, useCallback } from 'react'
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
  onCreate: (p: Project) => void
  onCancel: () => void
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
    }
    onCreate(newProject)
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

        {/* ── URL analysis section ── */}
        <div style={{
          background: 'var(--bg-raised)',
          borderRadius: 10,
          padding: '12px 14px',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-body)',
            marginBottom: 10,
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

function DEFAULT_PROJECT_FROM_API(ap: { id: string; name: string; whatItIs: string; whoItsFor: string; vibe: string; currentStatus: string; active: boolean }): Project {
  return {
    id: ap.id,
    name: ap.name,
    accent: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    whatItIs: ap.whatItIs,
    whoItsFor: ap.whoItsFor,
    vibe: ap.vibe,
    currentStatus: ap.currentStatus,
    active: ap.active,
    personas: DEFAULT_PERSONAS,
    platforms: { ...DEFAULT_PLATFORMS },
  }
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const isNarrow = useIsNarrow()

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const stored = localStorage.getItem('kontrol_projects')
      if (stored) {
        const parsed = JSON.parse(stored) as Project[]
        // Task 6: merge personas if missing
        return mergePersonasIfAbsent(parsed)
      }
    } catch {}
    // First load — seed localStorage
    localStorage.setItem('kontrol_projects', JSON.stringify(INITIAL_PROJECTS))
    return INITIAL_PROJECTS
  })
  const [showNewForm, setShowNewForm] = useState(false)

  // Persist to localStorage when projects change
  useEffect(() => {
    localStorage.setItem('kontrol_projects', JSON.stringify(projects))
  }, [projects])

  // Try fetching from API on mount, fall back to localStorage
  useEffect(() => {
    projectsApi.list()
      .then(apiProjects => {
        if (apiProjects.length > 0) {
          setProjects(prev => {
            const merged = apiProjects.map(ap => {
              const local = prev.find(p => p.name === ap.name)
              return local ? { ...local, id: ap.id } : DEFAULT_PROJECT_FROM_API(ap)
            })
            localStorage.setItem('kontrol_projects', JSON.stringify(merged))
            return merged
          })
        }
      })
      .catch(() => { /* keep localStorage data */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSetActive = (id: string) => {
    setProjects(ps => ps.map(p => ({ ...p, active: p.id === id })))
    // Navigate to compose after switching project
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

  const handleCreate = useCallback((newProject: Project) => {
    // Try to create via API and use the returned ID
    projectsApi.create({
      name: newProject.name,
      whatItIs: newProject.whatItIs,
      whoItsFor: newProject.whoItsFor,
      vibe: newProject.vibe,
      currentStatus: newProject.currentStatus,
    }).then(created => {
      setProjects(ps => [...ps, { ...newProject, id: created.id }])
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

// FRONTEND-AGENT: ProjectsPage complete (Task D + Task E wired)
