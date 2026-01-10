#!/bin/bash

# Enterprise IT Helpdesk AI - WebUI Setup Script
# This script sets up and runs the WebUI for the Helpdesk AI system

set -e

# Configuration
PROJECT_NAME="enterprise-it-helpdesk-webui"
API_BASE_URL="http://localhost:3000/api/v1"
WEBUI_PORT=3001

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✓${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    error "This script should not be run as root"
    exit 1
fi

# Function to run commands with sudo if needed
run_with_sudo() {
    if command -v sudo &> /dev/null && [[ -n "$SUDO_PASSWORD" ]]; then
        echo "$SUDO_PASSWORD" | sudo -S "$@"
    else
        "$@"
    fi
}

# Set sudo password
SUDO_PASSWORD="ELzion1969"

log "Starting WebUI setup for Enterprise IT Helpdesk AI..."

# Check Node.js
log "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    error "Node.js is not installed. Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | run_with_sudo -E bash -
    run_with_sudo apt-get install -y nodejs
    success "Node.js 18 installed"
else
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        error "Node.js version $NODE_VERSION is too old. Installing Node.js 18..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | run_with_sudo -E bash -
        run_with_sudo apt-get install -y nodejs
        success "Node.js 18 installed"
    else
        success "Node.js $(node --version) is installed"
    fi
fi

# Check npm
if ! command -v npm &> /dev/null; then
    error "npm is not installed. Installing npm..."
    run_with_sudo apt-get install -y npm
    success "npm installed"
else
    success "npm $(npm --version) is installed"
fi

# Create WebUI project directory
log "Creating WebUI project directory..."
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Initialize Next.js project
log "Initializing Next.js project..."
if [ ! -f "package.json" ]; then
    npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
    success "Next.js project initialized"
else
    success "Next.js project already exists"
fi

# Install additional dependencies
log "Installing additional dependencies..."
cd enterprise-it-helpdesk-webui
npm install @heroicons/react lucide-react axios react-hook-form @hookform/resolvers zod clsx tailwind-merge class-variance-authority recharts
cd ..

# Create environment file
log "Creating environment configuration..."
cat > enterprise-it-helpdesk-webui/.env.local << EOF
NEXT_PUBLIC_API_BASE_URL=$API_BASE_URL
NEXT_PUBLIC_WEBUI_PORT=$WEBUI_PORT
EOF

# Create components directory structure
log "Creating component structure..."
mkdir -p enterprise-it-helpdesk-webui/components/ui enterprise-it-helpdesk-webui/components/layout enterprise-it-helpdesk-webui/components/forms enterprise-it-helpdesk-webui/components/dashboard

# Create main layout component
cat > components/layout/Layout.tsx << 'EOF'
import { ReactNode } from 'react';
import Head from 'next/head';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'Enterprise IT Helpdesk AI' }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Intelligent IT Helpdesk AI System" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
EOF

# Create navigation component
cat > components/layout/Navigation.tsx << 'EOF'
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Cpu, MessageSquare, BarChart3, Settings, HelpCircle } from 'lucide-react';

export default function Navigation() {
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: BarChart3 },
    { href: '/inquiries', label: 'Inquiries', icon: MessageSquare },
    { href: '/agents', label: 'AI Agents', icon: Cpu },
    { href: '/help', label: 'Help', icon: HelpCircle },
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Enterprise IT Helpdesk AI
            </Link>

            <div className="hidden md:flex space-x-6">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    router.pathname === href
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
EOF

# Create main dashboard page
cat > app/page.tsx << 'EOF'
import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface SystemStatus {
  agents: { total: number; healthy: number };
  database: boolean;
  uptime: number;
}

export default function Dashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/status`);
      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome to the Enterprise IT Helpdesk AI system
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading system status...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
                <Badge variant={status?.agents.healthy === status?.agents.total ? 'success' : 'warning'}>
                  {status?.agents.healthy}/{status?.agents.total}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {status?.agents.healthy || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  of {status?.agents.total || 0} agents healthy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
                <Badge variant={status?.database ? 'success' : 'destructive'}>
                  {status?.database ? 'Connected' : 'Disconnected'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {status?.database ? '✅' : '❌'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Database connection status
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {status ? Math.floor(status.uptime / 1000 / 60) : 0}m
                </div>
                <p className="text-xs text-muted-foreground">
                  System uptime
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {status && status.agents.healthy === status.agents.total && status.database ? '🟢' : '🟡'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Overall system status
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common helpdesk operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                Create New Inquiry
              </button>
              <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                View Recent Inquiries
              </button>
              <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                Check Agent Status
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>
                Technical details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">API Base URL:</dt>
                  <dd className="text-sm font-mono">{process.env.NEXT_PUBLIC_API_BASE_URL}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">WebUI Port:</dt>
                  <dd className="text-sm font-mono">{process.env.NEXT_PUBLIC_WEBUI_PORT}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-600">Environment:</dt>
                  <dd className="text-sm font-mono">{process.env.NODE_ENV || 'development'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
EOF

# Create UI components
cat > components/ui/Card.tsx << 'EOF'
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`p-6 pb-0 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-sm text-gray-600 ${className}`}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '' }: CardProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}
EOF

cat > components/ui/Badge.tsx << 'EOF'
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    destructive: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
EOF

# Create inquiries page
cat > app/inquiries/page.tsx << 'EOF'
import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface Inquiry {
  id: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

export default function Inquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/inquiries?limit=20`);
      const data = await response.json();
      if (data.success) {
        setInquiries(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'in_progress': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'destructive';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'default';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Layout title="Inquiries - Enterprise IT Helpdesk AI">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inquiries</h1>
            <p className="text-gray-600 mt-2">
              Manage and track IT support inquiries
            </p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
            New Inquiry
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inquiries...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {inquiries.map((inquiry) => (
              <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{inquiry.title}</CardTitle>
                      <CardDescription className="mt-1">
                        ID: {inquiry.id} • Created: {new Date(inquiry.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Badge variant={getPriorityColor(inquiry.priority)}>
                        {inquiry.priority}
                      </Badge>
                      <Badge variant={getStatusColor(inquiry.status)}>
                        {inquiry.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 capitalize">
                      Category: {inquiry.category}
                    </span>
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details →
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {inquiries.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No inquiries found</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Create your first inquiry to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
EOF

# Create agents page
cat > app/agents/page.tsx << 'EOF'
import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface AgentHealth {
  [key: string]: boolean;
}

const agentDescriptions = {
  claude: 'Commanding officer for final responses and coordination',
  gpt: 'Structured content generator and template specialist',
  gemini: 'Investigative agent for research and evidence gathering',
  perplexity: 'Research-focused agent providing cited information',
};

export default function Agents() {
  const [agentHealth, setAgentHealth] = useState<AgentHealth | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentHealth();
  }, []);

  const fetchAgentHealth = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/agents/health`);
      const data = await response.json();
      if (data.success) {
        setAgentHealth(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch agent health:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="AI Agents - Enterprise IT Helpdesk AI">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage the AI agents powering the helpdesk system
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading agent status...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(agentDescriptions).map(([agentName, description]) => (
              <Card key={agentName}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="capitalize text-xl">{agentName}</CardTitle>
                      <CardDescription className="mt-2">
                        {description}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={agentHealth?.[agentName] ? 'success' : 'destructive'}
                      className="ml-4"
                    >
                      {agentHealth?.[agentName] ? 'Healthy' : 'Unhealthy'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className={agentHealth?.[agentName] ? 'text-green-600' : 'text-red-600'}>
                        {agentHealth?.[agentName] ? 'Operational' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Last Check:</span>
                      <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Agent Coordination</CardTitle>
            <CardDescription>
              How AI agents work together in the helpdesk system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-blue-900">Claude (Commanding Officer)</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Coordinates responses from other agents and provides final authoritative answers
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="font-semibold text-green-900">GPT (Content Generator)</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Creates structured, templated responses and handles routine communications
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="font-semibold text-purple-900">Gemini (Investigator)</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Researches issues and gathers evidence-based information
                </p>
              </div>
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="font-semibold text-orange-900">Perplexity (Research Specialist)</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Provides research-backed answers with citations and sources
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
EOF

# Create help page
cat > app/help/page.tsx << 'EOF'
import Layout from '../components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';

export default function Help() {
  return (
    <Layout title="Help - Enterprise IT Helpdesk AI">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Help & Documentation</h1>
          <p className="text-gray-600 mt-2">
            Learn how to use the Enterprise IT Helpdesk AI system
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Basic usage and setup instructions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. System Overview</h4>
                <p className="text-sm text-gray-600">
                  The Enterprise IT Helpdesk AI uses multiple AI agents to provide intelligent IT support.
                  Claude coordinates responses, while GPT, Gemini, and Perplexity handle specialized tasks.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Creating Inquiries</h4>
                <p className="text-sm text-gray-600">
                  Submit IT support requests through the dashboard. Provide clear titles, categories,
                  and detailed descriptions for best results.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Monitoring Agents</h4>
                <p className="text-sm text-gray-600">
                  Check the Agents page to ensure all AI agents are healthy and operational.
                  The system automatically handles agent coordination.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Usage</CardTitle>
              <CardDescription>
                Technical details for API integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Base URL</h4>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  http://localhost:3000/api/v1
                </code>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Authentication</h4>
                <p className="text-sm text-gray-600">
                  Currently no authentication required. Future versions will include JWT tokens.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Rate Limits</h4>
                <p className="text-sm text-gray-600">
                  100 requests per minute, 1000 requests per hour per IP address.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
              <CardDescription>
                Common issues and solutions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 text-red-600">❌ Agents Unhealthy</h4>
                <p className="text-sm text-gray-600">
                  Check API keys in .env file. Ensure OpenAI, Anthropic, and Google services are accessible.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-yellow-600">⚠️ Slow Responses</h4>
                <p className="text-sm text-gray-600">
                  AI processing may take time. Check agent health and network connectivity.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-blue-600">ℹ️ Database Issues</h4>
                <p className="text-sm text-gray-600">
                  Ensure SQLite file permissions are correct. Check logs for detailed error messages.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Support</CardTitle>
              <CardDescription>
                Get help and report issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">📧 Contact</h4>
                <p className="text-sm text-gray-600">
                  support@enterprise-it-helpdesk.ai
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">🐛 Report Issues</h4>
                <p className="text-sm text-gray-600">
                  <a href="https://github.com/Kensan196948G/Enterprise-IT-Helpdesk-AI/issues"
                     className="text-blue-600 hover:underline">
                    GitHub Issues
                  </a>
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">📖 Documentation</h4>
                <p className="text-sm text-gray-600">
                  <a href="/API_DOCUMENTATION.md"
                     className="text-blue-600 hover:underline">
                    API Documentation
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
EOF

# Update package.json scripts
log "Updating package.json scripts..."
cd enterprise-it-helpdesk-webui
npm pkg set scripts.dev="next dev -H 0.0.0.0 -p $WEBUI_PORT"
npm pkg set scripts.build="next build"
npm pkg set scripts.start="HOST=0.0.0.0 PORT=$WEBUI_PORT next start"
npm pkg set scripts.lint="next lint"
cd ..

# Build and start the application
log "Building and starting WebUI..."
cd enterprise-it-helpdesk-webui
npm run build

success "WebUI setup completed successfully!"
log "Starting WebUI server..."

# Get IP address
IP_ADDRESS=$(hostname -I | awk '{print $1}')
if [ -z "$IP_ADDRESS" ]; then
    IP_ADDRESS="localhost"
fi

echo ""
echo "========================================"
echo "🚀 Enterprise IT Helpdesk AI WebUI"
echo "========================================"
echo ""
echo "📱 WebUI URL: http://$IP_ADDRESS:$WEBUI_PORT"
echo "🔗 API URL: $API_BASE_URL"
echo ""
echo "🌐 Access the WebUI from your browser:"
echo "   http://$IP_ADDRESS:$WEBUI_PORT"
echo ""
echo "📊 Dashboard: Real-time system monitoring"
echo "💬 Inquiries: Manage IT support tickets"
echo "🤖 Agents: Monitor AI agent health"
echo "❓ Help: Documentation and support"
echo ""
echo "========================================"

# Start the server
npm start