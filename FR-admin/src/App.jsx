import { useState } from 'react';
import { Users, FileText, MessageSquare, Settings, CreditCard, Upload, BookOpen, Gift } from 'lucide-react';
import Submissions from './components/Submissions';
import Prompts from './components/Prompts';
import Feedback from './components/Feedback';
import UserManagement from './components/UserManagement';
import SubscriptionManagement from './components/SubscriptionManagement';
import LearningMaterials from './components/LearningMaterials';
import SendResources from './components/SendResources';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('submissions');

  const tabs = [
    { id: 'submissions', label: 'User Submissions', icon: FileText, component: Submissions },
    { id: 'prompts', label: 'Upload Prompts', icon: Upload, component: Prompts },
    { id: 'materials', label: 'Learning Materials', icon: BookOpen, component: LearningMaterials },
    { id: 'feedback', label: 'Add Feedback', icon: MessageSquare, component: Feedback },
    { id: 'resources', label: 'Send Resources', icon: Gift, component: SendResources },
    { id: 'users', label: 'Manage Users', icon: Users, component: UserManagement },
    { id: 'subscriptions', label: 'Manage Subscriptions', icon: CreditCard, component: SubscriptionManagement }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="admin-app">
      <header className="admin-header">
        <h1>French Learning Admin Panel</h1>
      </header>

      <div className="admin-layout">
        <nav className="admin-sidebar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={20} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <main className="admin-content">
          {ActiveComponent && <ActiveComponent />}
        </main>
      </div>
    </div>
  );
}

export default App;