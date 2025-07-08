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
    'Soprano',
    'Alto',
    'Tenor',
    'Bass',
    'Mezzo-Soprano',
    'Baritone',
    'Countertenor',
  ];

  const instruments = [
    'Piano',
    'Guitar',
    'Violin',
    'Cello',
    'Flute',
    'Clarinet',
    'Trumpet',
    'Saxophone',
    'Drums',
    'Bass',
    'Other',
  ];

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-600 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl mr-4 flex items-center justify-center border border-purple-400/30">
            <div className="w-6 h-6 bg-purple-500 rounded-lg"></div>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Member Information</h2>
            <p className="text-gray-300 text-sm">Edit basic member details</p>
          </div>
        </div>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-semibold"
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Legal Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Legal Name
            </label>
            <input
              type="text"
              value={formData.legalName}
              onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
              placeholder="Full legal name (if different from first/last name)"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Section and Birthday */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Section
              </label>
              <select
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Birthday
              </label>
              <input
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {formData.birthday && (
                <p className="text-sm text-gray-400 mt-1">
                  Age: {calculateAge(formData.birthday)} years old
                </p>
              )}
            </div>
          </div>

          {/* Instrument */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Instrument
            </label>
            <select
              value={formData.instrument}
              onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
          <div className="flex items-center gap-3 pt-4 border-t border-gray-600">
            <button
              onClick={handleSave}
              disabled={loading || !formData.firstName || !formData.lastName}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-semibold"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 font-semibold"
            >
              Cancel
            </button>
            
            {/* Status Message */}
            {message && (
              <div className={`flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  message.type === 'success' ? 'bg-green-400' : 'bg-red-400'
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
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Name</h3>
              <p className="text-white font-medium">
                {currentInfo.firstName} {currentInfo.lastName}
              </p>
              {currentInfo.legalName && (
                <p className="text-gray-400 text-sm mt-1">
                  Legal: {currentInfo.legalName}
                </p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Section</h3>
              <p className="text-white font-medium">
                {currentInfo.section || 'Not specified'}
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Birthday</h3>
              <p className="text-white font-medium">
                {currentInfo.birthday 
                  ? new Date(currentInfo.birthday).toLocaleDateString()
                  : 'Not specified'
                }
              </p>
              {currentInfo.birthday && (
                <p className="text-gray-400 text-sm mt-1">
                  Age: {calculateAge(currentInfo.birthday)} years old
                </p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-2">Instrument</h3>
              <p className="text-white font-medium">
                {currentInfo.instrument || 'Not specified'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
