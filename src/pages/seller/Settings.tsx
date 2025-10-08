import { useState } from 'react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';
import { ShiprocketSettings } from '../../components/shiprocket/ShiprocketSettings';
import { Settings, Truck, User, Bell } from 'lucide-react';

type SettingsTab = 'profile' | 'shiprocket' | 'notifications';

export function SellerSettings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('shiprocket');

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'Profile', icon: User },
    { id: 'shiprocket' as SettingsTab, label: 'Shiprocket', icon: Truck },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Breadcrumb
        items={[
          { label: 'Seller Dashboard', path: '/seller/dashboard' },
          { label: 'Settings' }
        ]}
        className="mb-6"
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-gray-600 mt-1">Manage your account and integration settings</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <nav className="flex flex-col">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="md:col-span-3">
          {activeTab === 'shiprocket' && <ShiprocketSettings />}

          {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Profile Settings</h2>
              <p className="text-gray-600">Profile settings coming soon...</p>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
              <p className="text-gray-600">Notification settings coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
