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
  };
}

export function MemberInfoEditor({ memberId, currentInfo }: MemberInfoEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    firstName: currentInfo.firstName || '',
    lastName: currentInfo.lastName || '',
    legalName: currentInfo.legalName || '',
    section: currentInfo.section || '',
    birthday: currentInfo.birthday || '',
    instrument: currentInfo.instrument || '',
  });

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
        throw new Error('Failed to update member information');
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
    setFormData({
      firstName: currentInfo.firstName || '',
      lastName: currentInfo.lastName || '',
      legalName: currentInfo.legalName || '',
      section: currentInfo.section || '',
      birthday: currentInfo.birthday || '',
      instrument: currentInfo.instrument || '',
    });
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

  const inputClassName =
    'w-full rounded-lg border border-[#d6dde5] bg-white px-4 py-3 text-[#2C3E50] placeholder:text-[#788896] focus:outline-none focus:ring-2 focus:ring-[#f38d68] focus:border-[#f38d68]';

  return (
    <div className="mb-8 rounded-2xl border border-[#d6dde5] bg-white p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#d6dde5] bg-[#f7f9fb]">
            <div className="h-6 w-6 rounded-lg bg-[#0D47A1]"></div>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[#2C3E50] sm:text-2xl">Member Information</h2>
            <p className="text-sm text-[#788896]">Edit basic member details</p>
          </div>
        </div>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-lg border border-[#d6dde5] bg-white px-4 py-2 font-semibold text-[#2C3E50] transition-colors duration-200 hover:bg-[#f7f9fb]"
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
              <label className="mb-2 block text-sm font-semibold text-[#2C3E50]">
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
              <label className="mb-2 block text-sm font-semibold text-[#2C3E50]">
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
            <label className="mb-2 block text-sm font-semibold text-[#2C3E50]">
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
              <label className="mb-2 block text-sm font-semibold text-[#2C3E50]">
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
              <label className="mb-2 block text-sm font-semibold text-[#2C3E50]">
                Birthday
              </label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                className={inputClassName}
              />
              {formData.birthday && (
                <p className="mt-1 text-sm text-[#788896]">
                  Age: {calculateAge(formData.birthday)} years old
                </p>
              )}
            </div>
          </div>

          {/* Instrument */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#2C3E50]">
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

          {/* Action Buttons */}
          <div className="flex items-center gap-3 border-t border-[#d6dde5] pt-4">
            <button
              onClick={handleSave}
              disabled={loading || !formData.firstName || !formData.lastName}
              className="rounded-lg border border-[#f38d68] bg-[#f38d68] px-6 py-2 font-semibold text-black transition-colors duration-200 hover:bg-[#f5a07f] disabled:cursor-not-allowed disabled:border-[#d6dde5] disabled:bg-[#eef3f8] disabled:text-[#788896]"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="rounded-lg border border-[#d6dde5] bg-white px-6 py-2 font-semibold text-[#2C3E50] transition-colors duration-200 hover:bg-[#f7f9fb] disabled:cursor-not-allowed disabled:bg-[#eef3f8] disabled:text-[#788896]"
            >
              Cancel
            </button>
            
            {/* Status Message */}
            {message && (
              <div className={`flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
                message.type === 'success'
                  ? 'border border-emerald-400 bg-emerald-100 text-emerald-900'
                  : 'border border-rose-400 bg-rose-100 text-rose-900'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  message.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
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
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#788896]">Name</h3>
              <p className="font-medium text-[#2C3E50]">
                {currentInfo.firstName} {currentInfo.lastName}
              </p>
              {currentInfo.legalName && (
                <p className="mt-1 text-sm text-[#788896]">
                  Legal: {currentInfo.legalName}
                </p>
              )}
            </div>
            
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#788896]">Section</h3>
              <p className="font-medium text-[#2C3E50]">
                {currentInfo.section || 'Not specified'}
              </p>
            </div>
            
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#788896]">Birthday</h3>
              <p className="font-medium text-[#2C3E50]">
                {currentInfo.birthday 
                  ? new Date(currentInfo.birthday).toLocaleDateString()
                  : 'Not specified'
                }
              </p>
              {currentInfo.birthday && (
                <p className="mt-1 text-sm text-[#788896]">
                  Age: {calculateAge(currentInfo.birthday)} years old
                </p>
              )}
            </div>
            
            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#788896]">Instrument</h3>
              <p className="font-medium text-[#2C3E50]">
                {currentInfo.instrument || 'Not specified'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
