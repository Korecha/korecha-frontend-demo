import { useEffect, useState, type FormEvent, useCallback } from 'react'
import {
    createCommissionSetting,
    getEffectiveCommission,
    listCommissionSettings,
} from '../../api/admin'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Field, Input, Select } from '../../components/ui/Input'
import { Loading } from '../../components/ui/Loading'
import { PageHeader } from '../../components/ui/PageHeader'
import {
    Table,
    TableEmpty,
    TableHead,
    TableRow,
    TableWrapper,
    Td,
    Th,
} from '../../components/ui/Table'
import type {
    CommissionScopeType,
    CommissionSetting,
    CorporateTier,
    EffectiveCommission,
    ShipmentMode,
} from '../../types'
import { formatDate } from '../../utils/format'

const SCOPE_TYPES: CommissionScopeType[] = ['GLOBAL', 'MODE', 'TIER']
const MODES: ShipmentMode[] = ['UNIMODAL', 'MULTIMODAL']
const TIERS: CorporateTier[] = ['STANDARD', 'PRIORITY', 'PREFERRED']

export function CommissionSettingsPage() {
    const [settings, setSettings] = useState<CommissionSetting[]>([])
    const [effective, setEffective] = useState<EffectiveCommission | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [formError, setFormError] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const [form, setForm] = useState({
        ratePct: 0,
        scopeType: 'GLOBAL' as CommissionScopeType,
        scopeValue: '',
        effectiveFrom: new Date().toISOString().split('T')[0],
    })

    const load = useCallback(() => {
        Promise.all([listCommissionSettings({ page, limit: 50 }), getEffectiveCommission()])
            .then(([settingsRes, effectiveRes]) => {
                setSettings(settingsRes.data)
                setTotal(settingsRes.pagination.total)
                setEffective(effectiveRes.data)
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false))
    }, [page])

    useEffect(() => {
        load()
    }, [load])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setSaved(false)
        setFormError('')
        try {
            await createCommissionSetting({
                ratePct: form.ratePct,
                scopeType: form.scopeType,
                scopeValue: form.scopeType === 'GLOBAL' ? null : form.scopeValue || null,
                effectiveFrom: new Date(form.effectiveFrom).toISOString(),
            })
            setForm({
                ratePct: 0,
                scopeType: 'GLOBAL',
                scopeValue: '',
                effectiveFrom: new Date().toISOString().split('T')[0],
            })
            setSaved(true)
            load()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to save')
        } finally {
            setSaving(false)
        }
    }

    const scopeRequiresValue = form.scopeType !== 'GLOBAL'
    const scopeOptions = form.scopeType === 'MODE' ? MODES : form.scopeType === 'TIER' ? TIERS : []

    if (loading && settings.length === 0) return <Loading />

    return (
        <div className="space-y-6">
            <PageHeader
                title="Commission Settings"
                description="Configure platform commission rates with scoped rules"
            />

            {error && (
                <div className="mb-4">
                    <Alert>{error}</Alert>
                </div>
            )}

            {/* Currently Effective Rate */}
            {effective && (
                <Card>
                    <h3 className="font-bold text-slate-900">Currently Effective Rate</h3>
                    <div className="mt-3 flex items-center gap-4">
                        <div>
                            <p className="text-3xl font-bold text-korecha-primary">
                                {effective.effectiveRatePct}%
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                {effective.source.type === 'FALLBACK'
                                    ? 'No rule applies; using the platform default from Settings'
                                    : effective.source.setting
                                        ? `${effective.source.setting.scopeType} rule` +
                                        (effective.source.setting.scopeValue
                                            ? ` (${effective.source.setting.scopeValue})`
                                            : '')
                                        : 'Active rule'}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* History Table */}
            <Card>
                <h3 className="mb-4 font-bold text-slate-900">Commission Rate History</h3>
                <TableWrapper>
                    <Table>
                        <TableHead>
                            <tr>
                                <Th>Rate</Th>
                                <Th>Scope</Th>
                                <Th>Effective From</Th>
                                <Th>Created By</Th>
                                <Th>Created At</Th>
                            </tr>
                        </TableHead>
                        <tbody>
                            {settings.length === 0 ? (
                                <TableEmpty colSpan={5} message="No commission rules configured yet" />
                            ) : (
                                settings.map((setting) => (
                                    <TableRow key={setting.id}>
                                        <Td className="font-semibold">{setting.ratePct}%</Td>
                                        <Td>
                                            <div>
                                                <p className="font-medium">{setting.scopeType}</p>
                                                {setting.scopeValue && (
                                                    <p className="text-sm text-slate-500">{setting.scopeValue}</p>
                                                )}
                                            </div>
                                        </Td>
                                        <Td>{formatDate(setting.effectiveFrom)}</Td>
                                        <Td>
                                            <div>
                                                <p className="font-medium">{setting.createdBy.fullName}</p>
                                                <p className="text-sm text-slate-500">{setting.createdBy.email}</p>
                                            </div>
                                        </Td>
                                        <Td>{formatDate(setting.createdAt)}</Td>
                                    </TableRow>
                                ))
                            )}
                        </tbody>
                    </Table>
                </TableWrapper>
                {total > 50 && (
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-slate-600">
                            Showing {(page - 1) * 50 + 1}-{Math.min(page * 50, total)} of {total}
                        </p>
                        <div className="flex gap-2">
                            <Button variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
                                Previous
                            </Button>
                            <Button
                                variant="secondary"
                                disabled={page * 50 >= total}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Add New Rule Form */}
            <Card>
                <h3 className="mb-4 font-bold text-slate-900">Add New Commission Rule</h3>
                {formError && (
                    <div className="mb-4">
                        <Alert>{formError}</Alert>
                    </div>
                )}
                {saved && (
                    <div className="mb-4">
                        <Alert variant="success">Commission rule added successfully</Alert>
                    </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Field label="Rate (%)">
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                step={0.01}
                                value={form.ratePct}
                                onChange={(e) => setForm({ ...form, ratePct: Number(e.target.value) })}
                                required
                            />
                        </Field>
                        <Field label="Scope Type">
                            <Select
                                value={form.scopeType}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        scopeType: e.target.value as CommissionScopeType,
                                        scopeValue: '',
                                    })
                                }
                            >
                                {SCOPE_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {scopeRequiresValue && (
                            <Field label={form.scopeType === 'MODE' ? 'Shipment Mode' : 'Corporate Tier'}>
                                <Select
                                    value={form.scopeValue}
                                    onChange={(e) => setForm({ ...form, scopeValue: e.target.value })}
                                    required
                                >
                                    <option value="">Select {form.scopeType === 'MODE' ? 'mode' : 'tier'}</option>
                                    {scopeOptions.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                        )}
                        <Field label="Effective From">
                            <Input
                                type="date"
                                value={form.effectiveFrom}
                                onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                                required
                            />
                        </Field>
                    </div>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Adding...' : 'Add Rule'}
                    </Button>
                </form>
            </Card>
        </div>
    )
}
