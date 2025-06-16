'use client'

import { Bell, Link} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useUserInfo } from '@/hooks/useUserInfo'
import getBase64 from '@/app/utils/getBase64'
import { useNotifications } from './useNotifications'
import ThemeSwitcher from './ThemeSwitcher'
import type { Notification } from './useNotifications';

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'error':
      return 'bg-red-500'
    case 'warning':
      return 'bg-yellow-500'
    case 'success':
      return 'bg-green-500'
    default:
      return 'bg-blue-500'
  }
}

export default function Header () {
  // ...existing state and hooks...

  // Mark all notifications as read
  // Mark all notifications as read and persist to backend
  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.read && n.id && !n.id.startsWith('cert-')).map(n => n.id);
    // Only persist for DB notifications (not cert- notifications)
    if (unreadIds.length > 0) {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: unreadIds })
      });
    }
    if (typeof setNotifications === 'function') {
      setNotifications((prev: Notification[]) => prev.map(n => ({ ...n, read: true })));
    } else {
      notifications.forEach(n => n.read = true);
    }
  };

  // Mark a single notification as read and persist, then navigate
  const handleViewDetails = async (notification: Notification) => {
    if (!notification.read && notification.id && !notification.id.startsWith('cert-')) {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [notification.id] })
      });
    }
    if (typeof setNotifications === 'function') {
      setNotifications((prev: Notification[]) => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
    }
    if (notification.actionLink && router) {
      router.push(notification.actionLink);
    }
  };

  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [preferencesSaveSuccess, setPreferencesSaveSuccess] = useState(false)
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false)

  // Preferences state
  // User Preferences (regional) state
  const [profile, setProfile] = useState<any>(null)
  const { user } = useUserInfo()

  // Initialize preference and appearance state from profile or defaults
  const [language, setLanguage] = useState(() => profile?.language || 'en')
  const [timezone, setTimezone] = useState(
    () => profile?.timezone || 'Asia/Singapore'
  )
  const [dateFormat, setDateFormat] = useState(
    () => profile?.dateFormat || 'DD/MM/YYYY'
  )
  const [timeFormat, setTimeFormat] = useState(
    () => profile?.timeFormat || '24'
  )
  const [currency, setCurrency] = useState(() => profile?.currency || 'SGD')

  const [notificationPreferences, setNotificationPreferences] =
    useState<any>(null)
    // If you have notification preferences from state or props, pass them in:
    const { notifications, loading, setNotifications } = useNotifications(notificationPreferences)
  const { removeAllData } = useUserInfo()

  
  const router =
    typeof window !== 'undefined'
      ? require('next/navigation').useRouter()
      : undefined

  // Sign out function: clear all data, remove cookie, redirect
  const handleSignOut = async () => {
    removeAllData()
    // Remove auth cookies by expiring them (client-side, for non-HttpOnly cookies)
    if (typeof document !== 'undefined') {
      document.cookie =
        'token=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;'
      document.cookie =
        'next-auth.session-token=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;'
    }
    // Redirect to login
    if (router) {
      router.push('/login')
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }

  // Fetch notification preferences and profile on mount
  useEffect(() => {
    async function fetchData () {
      try {
        // Fetch profile and preferences
        const prefsRes = await fetch('/api/profile')
        const prefsData = await prefsRes.json()
        setProfile(prefsData)
        let prefs = null
        if (prefsData.notificationPreferences) {
          prefs =
            typeof prefsData.notificationPreferences === 'string'
              ? JSON.parse(prefsData.notificationPreferences)
              : prefsData.notificationPreferences
      setNotificationPreferences(prefs)
        }
      } catch {
        // No-op: notifications handled by hook
      }
    }
    fetchData()
  }, [])

  const handleSavePreferences = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          language,
          timezone,
          dateFormat,
          timeFormat,
          currency
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save preferences')
      setProfile((prev: any) => ({ ...prev, ...data }))
      setPreferencesSaveSuccess(true)
      setTimeout(() => setPreferencesSaveSuccess(false), 3000)
      setPreferencesOpen(false)
    } catch (err: any) {
      setPreferencesSaveSuccess(false)
      alert(err.message || 'Failed to save preferences')
    }
  }


  return (
    <header className='border-b bg-background'>
      <div className='flex h-16 items-center px-4 gap-4'>
        <div className='flex items-center gap-4 flex-1 justify-end'>
          <ThemeSwitcher/>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='relative'>
                <Bell className='h-5 w-5' />
                <span className='absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center'>
                  {notifications.filter(n => !n.read).length}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-80'>
              <div className='p-4 border-b'>
                <h3 className='font-semibold'>Notifications</h3>
              </div>
              <div className='max-h-96 overflow-y-auto'>
                {notifications.length > 0 ? (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b bg-background ${!notification.read ? 'bg-blue-50' : ''}`}
                    >
                      <div className='flex items-start gap-3 text-foreground'>
                        <div
                          className={`w-2 h-2 rounded-full mt-2 ${getNotificationColor(
                            notification.type
                          )}`}
                        />
                        <div className='flex-1'>
                          <p className='text-sm'>{notification.message}</p>
                          <p className='text-xs text-foreground mt-1'>
                            {notification.date.toLocaleString()}
                          </p>
                          {notification?.actionLink && (
                            <Button
                              size={"sm"}
                              onClick={() => handleViewDetails(notification)}
                              className='p-0 h-auto text-xs'
                              variant={"link"}
                            >
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className='p-4 text-center text-foreground'>
                    No notifications
                  </div>
                )}
              </div>
              <div className='p-2 border-t'>
                <Button 
                  variant='ghost' 
                  size='sm' 
                  className='w-full'
                  onClick={handleMarkAllAsRead}
                >
                  Mark all as read
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
                <Avatar className='h-8 w-8'>
                  {/* Prefer photoData (base64 from DB), then photoDataBase64, then photoUrl, then fallback */}
                  {profile && profile.photoData ? (
                    <img
                      src={`data:image/*;base64,${getBase64(
                        profile.photoData
                      )}`}
                      alt={profile.firstName || ''}
                      className='h-8 w-8 rounded-full object-cover'
                    />
                  ) : profile && profile.photoDataBase64 ? (
                    <img
                      src={`data:image/*;base64,${getBase64(
                        profile.photoDataBase64
                      )}`}
                      alt={profile.firstName || ''}
                      className='h-8 w-8 rounded-full object-cover'
                    />
                  ) : profile && profile.photoUrl ? (
                    <img
                      src={profile.photoUrl}
                      alt={profile.firstName || ''}
                      className='h-8 w-8 rounded-full object-cover'
                    />
                  ) : (
                    <AvatarFallback>
                      {profile && profile.firstName
                        ? profile.firstName[0]
                        : user?.email?.[0] || 'U'}
                    </AvatarFallback>
                  )}
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-56' align='end' forceMount>
              <div className='flex items-center justify-start gap-2 p-2'>
                <div className='flex flex-col space-y-1 leading-none'>
                  <p className='font-medium'>
                    {profile
                      ? `${profile.firstName || ''} ${
                          profile.lastName || ''
                        }`.trim()
                      : 'User'}
                  </p>
                  <p className='w-[200px] truncate text-sm text-muted-foreground'>
                    {profile?.email || user?.email || ''}
                  </p>
                </div>
              </div>
              <div className='border-t my-1'></div>
              <div className='p-1'>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  size='sm'
                  onClick={() => (window.location.href = '/profile')}
                >
                  Profile Settings
                </Button>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  size='sm'
                  onClick={() => setPreferencesOpen(true)}
                >
                  Preferences
                </Button>
                <div className='border-t my-1'></div>
                <Button
                  variant='ghost'
                  className='w-full justify-start'
                  size='sm'
                  onClick={() => setHelpOpen(true)}
                >
                  Help & Support
                </Button>
                <Button
                  variant='ghost'
                  className='w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50'
                  size='sm'
                  onClick={() => setSignOutConfirmOpen(true)}
                >
                  Sign Out
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>User Preferences</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue='regional' className='mt-4'>
            <TabsContent value='regional' className='space-y-4'>
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='language'>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select language' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='en'>English</SelectItem>
                      <SelectItem value='zh'>中文</SelectItem>
                      <SelectItem value='ms'>Bahasa Melayu</SelectItem>
                      <SelectItem value='ta'>தமிழ்</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='timezone'>Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select timezone' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='Asia/Singapore'>
                        Singapore (GMT+8)
                      </SelectItem>
                      <SelectItem value='Asia/Kuala_Lumpur'>
                        Kuala Lumpur (GMT+8)
                      </SelectItem>
                      <SelectItem value='Asia/Jakarta'>
                        Jakarta (GMT+7)
                      </SelectItem>
                      <SelectItem value='Asia/Bangkok'>
                        Bangkok (GMT+7)
                      </SelectItem>
                      <SelectItem value='UTC'>UTC (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='date-format'>Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select date format' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='DD/MM/YYYY'>DD/MM/YYYY</SelectItem>
                      <SelectItem value='MM/DD/YYYY'>MM/DD/YYYY</SelectItem>
                      <SelectItem value='YYYY-MM-DD'>YYYY-MM-DD</SelectItem>
                      <SelectItem value='DD-MM-YYYY'>DD-MM-YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='time-format'>Time Format</Label>
                  <Select value={timeFormat} onValueChange={setTimeFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select time format' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='24'>24-hour (14:30)</SelectItem>
                      <SelectItem value='12'>12-hour (2:30 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor='currency'>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder='Select currency' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='SGD'>
                        SGD - Singapore Dollar
                      </SelectItem>
                      <SelectItem value='USD'>USD - US Dollar</SelectItem>
                      <SelectItem value='EUR'>EUR - Euro</SelectItem>
                      <SelectItem value='MYR'>
                        MYR - Malaysian Ringgit
                      </SelectItem>
                      <SelectItem value='IDR'>
                        IDR - Indonesian Rupiah
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className='flex items-center justify-between'>
            {preferencesSaveSuccess && (
              <span className='text-sm text-green-600'>
                Preferences saved successfully!
              </span>
            )}
            <div className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() => setPreferencesOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSavePreferences}>Save Preferences</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue='faq' className='mt-4'>
            {/* <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList> */}
            <TabsContent value='faq' className='space-y-4'>
              <div className='space-y-4'>
                <div className='p-4 border rounded-lg'>
                  <h4 className='font-medium mb-2'>
                    How do I add a new gondola?
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    Navigate to the Gondolas page and click the "Add Gondola"
                    button. Fill in the required information including gondola
                    ID, specifications, and certificates.
                  </p>
                </div>
                <div className='p-4 border rounded-lg'>
                  <h4 className='font-medium mb-2'>
                    How do I track certificate expiry?
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    Certificate expiry dates are automatically tracked. You'll
                    receive notifications 30 days before expiry. Check the
                    dashboard for upcoming expirations.
                  </p>
                </div>
                <div className='p-4 border rounded-lg'>
                  <h4 className='font-medium mb-2'>
                    How do I generate reports?
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    Use the "Generate Report" button on the dashboard to create
                    comprehensive reports. You can customize the date range and
                    data included.
                  </p>
                </div>
                <div className='p-4 border rounded-lg'>
                  <h4 className='font-medium mb-2'>
                    How do I manage user permissions?
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    User permissions are managed through the Account Settings.
                    Contact your administrator to modify user roles and access
                    levels.
                  </p>
                </div>
              </div>
            </TabsContent>
            {/* <TabsContent value="contact" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg text-center">
                    <h4 className="font-medium mb-2">Email Support</h4>
                    <p className="text-sm text-muted-foreground mb-2">support@gondola.com</p>
                    <p className="text-xs text-muted-foreground">Response within 24 hours</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <h4 className="font-medium mb-2">Phone Support</h4>
                    <p className="text-sm text-muted-foreground mb-2">+65 6123 4567</p>
                    <p className="text-xs text-muted-foreground">Mon-Fri, 9AM-6PM SGT</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-4">Submit a Support Ticket</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="ticket-subject">Subject</Label>
                      <Input id="ticket-subject" placeholder="Brief description of your issue" />
                    </div>
                    <div>
                      <Label htmlFor="ticket-priority">Priority</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ticket-description">Description</Label>
                      <Textarea
                        id="ticket-description"
                        placeholder="Please provide detailed information about your issue..."
                        rows={4}
                      />
                    </div>
                    <Button onClick={handleSubmitTicket} className="w-full">
                      {ticketSubmitted ? "Ticket Submitted!" : "Submit Ticket"}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent> */}
          </Tabs>
          <DialogFooter>
            <Button variant='outline' onClick={() => setHelpOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={signOutConfirmOpen} onOpenChange={setSignOutConfirmOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
          </DialogHeader>
          <div className='py-4'>
            <p className='text-sm text-muted-foreground'>
              Are you sure you want to sign out? You will need to log in again
              to access your account.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setSignOutConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant='destructive'
              onClick={() => {
                setSignOutConfirmOpen(false)
                handleSignOut()
              }}
            >
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
