'use client';
import React, { useState } from 'react';

interface MemberInfoEditorProps {
  memberId: string;
  currentInfo: {
    firstName: string;
    lastName: string;
    legalName: string | null;
    section: string | null;
    birthday: string | null;
    instrument: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    mailingAddress: string | null;
    school: string | null;
    parentEmail: string | null;
    parentPhone: string | null;
    previousSeasons: number;
  };
  vetDiscount: number;
}

type MemberInfo = MemberInfoEditorProps['currentInfo'];

const toFormData = (info: MemberInfo) => ({
  firstName: info.firstName || '',
  lastName: info.lastName || '',
  legalName: info.legalName || '',
  section: info.section || '',
  birthday: info.birthday || '',
  instrument: info.instrument || '',
  email: info.email || '',
  phone: info.phone || '',
  address: info.address || '',
  mailingAddress: info.mailingAddress || '',
  school: info.school || '',
  parentEmail: info.parentEmail || '',
  parentPhone: info.parentPhone || '',
  previousSeasons: String(info.previousSeasons ?? 0),
});

export function MemberInfoEditor({ memberId, currentInfo, vetDiscount }: MemberInfoEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState(() => toFormData(currentInfo));

  const handleSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/members/${memberId}/info`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || 'Failed to update member information');
      }

      setMessage({
        type: 'success',
        text: 'Member information updated successfully',
      });
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
      
      // Refresh the page after a short delay
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update member information',
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(toFormData(currentInfo));
    setIsEditing(false);
    setMessage(null);
  };

  const calculateAge = (birthday: string) => {
    if (!birthday) return null;
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const sections = [
    'Battery',
    'Cymbals',
    'Front Ensemble',
    'Visual'
  ];

  const instruments = [
    'Woods',
    'Metals',
    'Rhythm',
    'Bass',
    'Snare',
    'Quad/Tenor',
    'Cymbals',
    'Vis Ens'
  ];

  const contactFields: {
    key: 'email' | 'phone' | 'address' | 'mailingAddress' | 'school' | 'parentEmail' | 'parentPhone';
    label: string;
    type: 'email' | 'tel' | 'text';
    placeholder?: string;
  }[] = [
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Phone', type: 'tel' },
    { key: 'address', label: 'Physical Address', type: 'text', placeholder: 'Street, City, State, Zip' },
    { key: 'mailingAddress', label: 'Mailing Address', type: 'text', placeholder: 'Leave blank if same as physical' },
    { key: 'school', label: 'School', type: 'text' },
    { key: 'parentEmail', label: 'Parent/Cosigner Email', type: 'email' },
    { key: 'parentPhone', label: 'Parent/Cosigner Phone', type: 'tel' },
  ];

  const previousSeasonsDelta =
    formData.previousSeasons === '' ? 0 : Number(formData.previousSeasons) - (currentInfo.previousSeasons ?? 0);

  const inputClassName =
    'w-full rounded-lg border border-line bg-white px-4 py-3 text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ink/10 focus:border-ink';

  return (
    <div className="mb-8 rounded-2xl border border-line bg-white p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-wash">
            <div className="h-6 w-6 rounded-lg bg-ink"></div>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-ink sm:text-2xl">Member Information</h2>
            <p className="text-sm text-muted">Edit basic member details</p>
          </div>
        </div>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg border border-line bg-white px-4 py-2 font-semibold text-ink transition-colors duration-200 hover:bg-wash"
          >
            Edit Info
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-6">
          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={inputClassName}
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={inputClassName}
                required
              />
            </div>
          </div>

          {/* Legal Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-ink">
              Legal Name
            </label>
            <input
              type="text"
              value={formData.legalName}
              onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              placeholder="Full legal name (if different from first/last name)"
              className={inputClassName}
            />
          </div>

          {/* Section and Birthday */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">
                Section
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className={inputClassName}
              >
                <option value="">Select section</option>
                {sections.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">
                Birthday
              </label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                className={inputClassName}
              />
              {formData.birthday && (
                <p className="mt-1 text-sm text-muted">
                  Age: {calculateAge(formData.birthday)} years old
                </p>
              )}
            </div>
          </div>

          {/* Instrument and Previous Seasons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink">
                Instrument
              </label>
              <select
                value={formData.instrument}
                onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                className={inputClassName}
              >
                <option value="">Select instrument</option>
                {instruments.map((instrument) => (
                  <option key={instrument} value={instrument}>
                    {instrument}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="previous-seasons" className="mb-2 block text-sm font-semibold text-ink">
                Previous Seasons with Dark Sky
              </label>
              <input
                id="previous-seasons"
                type="number"
                min="0"
                step="1"
                value={formData.previousSeasons}
                onChange={(e) => setFormData({ ...formData, previousSeasons: e.target.value })}
                className={inputClassName}
              />
              <p className="mt-1 text-sm text-muted">
                {previousSeasonsDelta !== 0 && vetDiscount > 0
                  ? `Saving will ${previousSeasonsDelta > 0 ? 'lower' : 'raise'} tuition by $${Math.abs(previousSeasonsDelta * vetDiscount).toLocaleString()}.`
                  : `Completed seasons before this one. Each takes $${vetDiscount.toLocaleString()} off tuition.`}
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4 border-t border-line pt-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted">Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contactFields.map(({ key, label, type, placeholder }) => (
                <div key={key} className={key === 'address' || key === 'mailingAddress' ? 'sm:col-span-2' : undefined}>
                  <label className="mb-2 block text-sm font-semibold text-ink">
                    {label}{key === 'email' && ' *'}
                  </label>
                  <input
                    type={type}
                    value={formData[key]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={placeholder}
                    className={inputClassName}
                    required={key === 'email'}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 border-t border-line pt-4">
            <button
              onClick={handleSave}
              disabled={loading || !formData.firstName || !formData.lastName || !formData.email}
              className="rounded-lg border border-ink bg-ink px-6 py-2 font-semibold text-white transition-colors duration-200 hover:bg-ink-hover disabled:cursor-not-allowed disabled:border-line disabled:bg-canvas disabled:text-muted"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="rounded-lg border border-line bg-white px-6 py-2 font-semibold text-ink transition-colors duration-200 hover:bg-wash disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted"
            >
              Cancel
            </button>
            
            {/* Status Message */}
            {message && (
              <div className={`flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
                message.type === 'success'
                  ? 'border border-paid-line bg-paid-soft text-paid'
                  : 'border border-behind-line bg-behind-soft text-behind'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  message.type === 'success' ? 'bg-paid-solid' : 'bg-behind-solid'
                }`}></div>
                {message.text}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Display Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-muted">Name</h3>
              <p className="font-medium text-ink">
                {currentInfo.firstName} {currentInfo.lastName}
              </p>
              {currentInfo.legalName && (
                <p className="mt-1 text-sm text-muted">
                  Legal: {currentInfo.legalName}
                </p>
              )}
            </div>
            
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-muted">Section</h3>
              <p className="font-medium text-ink">
                {currentInfo.section || 'Not specified'}
              </p>
            </div>
            
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-muted">Birthday</h3>
              <p className="font-medium text-ink">
                {currentInfo.birthday 
                  ? new Date(currentInfo.birthday).toLocaleDateString()
                  : 'Not specified'
                }
              </p>
              {currentInfo.birthday && (
                <p className="mt-1 text-sm text-muted">
                  Age: {calculateAge(currentInfo.birthday)} years old
                </p>
              )}
            </div>
            
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-muted">Instrument</h3>
              <p className="font-medium text-ink">
                {currentInfo.instrument || 'Not specified'}
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-muted">Previous Seasons</h3>
              <p className="font-medium text-ink">
                {currentInfo.previousSeasons > 0
                  ? `${currentInfo.previousSeasons} (${ordinal(currentInfo.previousSeasons + 1)} season)`
                  : 'None (first season)'}
              </p>
            </div>
          </div>

          <div className="border-t border-line pt-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-muted">Contact</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {contactFields.map(({ key, label, type }) => {
                const value = currentInfo[key];
                const href = value && (type === 'email' ? `mailto:${value}` : type === 'tel' ? `tel:${value}` : null);
                return (
                  <div key={key} className={key === 'address' || key === 'mailingAddress' ? 'sm:col-span-2' : undefined}>
                    <dt className="text-sm text-muted">{label}</dt>
                    <dd className="break-words font-medium text-ink">
                      {href ? (
                        <a href={href} className="hover:text-muted hover:underline">{value}</a>
                      ) : (
                        value || (key === 'mailingAddress' ? 'Same as physical' : 'Not specified')
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function ordinal(n: number) {
  const suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] || 'th';
  return `${n}${suffix}`;
}
