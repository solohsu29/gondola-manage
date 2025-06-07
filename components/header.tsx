"use client"

import { Bell, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

export interface Notification {
  id: string
  type: "info" | "warning" | "error" | "success"
  message: string
  date: Date
  read: boolean
  actionLink?: string
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case "error":
      return "bg-red-500"
    case "warning":
      return "bg-yellow-500"
    case "success":
      return "bg-green-500"
    default:
      return "bg-blue-500"
  }
}

const notifications: Notification[] = [
  {
    id: "1",
    type: "warning",
    message: "MOM Certificate for GND-001-2023 expires in 30 days",
    date: new Date(),
    read: false,
    actionLink: "/gondolas/GND-001-2023",
  },
  {
    id: "2",
    type: "info",
    message: "Monthly inspection scheduled for GND-002-2023",
    date: new Date(Date.now() - 86400000),
    read: false,
    actionLink: "/inspections",
  },
]

export default function Header() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState("5")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [accountSaveSuccess, setAccountSaveSuccess] = useState(false)
  const [preferencesSaveSuccess, setPreferencesSaveSuccess] = useState(false)
  const [ticketSubmitted, setTicketSubmitted] = useState(false)
  const [signOutConfirmOpen, setSignOutConfirmOpen] = useState(false)

  // Preferences state
  const [language, setLanguage] = useState("en")
  const [timezone, setTimezone] = useState("Asia/Singapore")
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY")
  const [timeFormat, setTimeFormat] = useState("24")
  const [currency, setCurrency] = useState("SGD")
  const [soundNotifications, setSoundNotifications] = useState(true)
  const [emailDigest, setEmailDigest] = useState(true)
  const [autoSave, setAutoSave] = useState(true)

  const handleSaveSettings = () => {
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)
  }

  const handleSaveAccountSettings = () => {
    setAccountSaveSuccess(true)
    setTimeout(() => setAccountSaveSuccess(false), 3000)
  }

  const handleSavePreferences = () => {
    setPreferencesSaveSuccess(true)
    setTimeout(() => setPreferencesSaveSuccess(false), 3000)
  }

  const handleSubmitTicket = () => {
    setTicketSubmitted(true)
    setTimeout(() => {
      setTicketSubmitted(false)
      setHelpOpen(false)
    }, 2000)
  }

  return (
    <header className="border-b bg-white">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex items-center gap-4 flex-1 justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                  {notifications.filter((n) => !n.read).length}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b hover:bg-gray-50 ${!notification.read ? "bg-blue-50" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${getNotificationColor(notification.type)}`} />
                        <div className="flex-1">
                          <p className="text-sm">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.date.toLocaleDateString()}</p>
                          {notification.actionLink && (
                            <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">No notifications</div>
                )}
              </div>
              <div className="p-2 border-t">
                <Button variant="ghost" size="sm" className="w-full">
                  Mark all as read
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
            <Settings className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>GA</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">Gondola Admin</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">admin@gondola.com</p>
                </div>
              </div>
              <div className="border-t my-1"></div>
              <div className="p-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => (window.location.href = "/profile")}
                >
                  Profile Settings
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  size="sm"
                  onClick={() => setPreferencesOpen(true)}
                >
                  Preferences
                </Button>
                <div className="border-t my-1"></div>
                <Button variant="ghost" className="w-full justify-start" size="sm" onClick={() => setHelpOpen(true)}>
                  Help & Support
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  size="sm"
                  onClick={() => setSignOutConfirmOpen(true)}
                >
                  Sign Out
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Application Settings</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="appearance" className="mt-4">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            <TabsContent value="appearance" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable dark mode for the application</p>
                </div>
                <Switch id="dark-mode" checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="compact-mode">Compact Mode</Label>
                  <p className="text-sm text-muted-foreground">Use compact spacing for UI elements</p>
                </div>
                <Switch id="compact-mode" checked={compactMode} onCheckedChange={setCompactMode} />
              </div>
            </TabsContent>
            <TabsContent value="behavior" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-refresh">Auto Refresh</Label>
                  <p className="text-sm text-muted-foreground">Automatically refresh data</p>
                </div>
                <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              </div>
              {autoRefresh && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="refresh-interval">Refresh Interval</Label>
                    <p className="text-sm text-muted-foreground">How often to refresh data</p>
                  </div>
                  <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </TabsContent>
            <TabsContent value="system" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Data Storage</Label>
                  <p className="text-sm text-muted-foreground">Currently using 24.5 MB of storage</p>
                </div>
                <Button variant="outline" size="sm">
                  Clear Cache
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Application Version</Label>
                  <p className="text-sm text-muted-foreground">v1.2.3 (Latest)</p>
                </div>
                <Button variant="outline" size="sm">
                  Check for Updates
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="flex items-center justify-between">
            {saveSuccess && <span className="text-sm text-green-600">Settings saved successfully!</span>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSettings}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={accountSettingsOpen} onOpenChange={setAccountSettingsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="organization" className="mt-4">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="organization">Organization</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="organization" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" defaultValue="Gondola Management Corp" />
                </div>
                <div>
                  <Label htmlFor="org-email">Organization Email</Label>
                  <Input id="org-email" type="email" defaultValue="admin@gondola.com" />
                </div>
                <div>
                  <Label htmlFor="org-phone">Phone Number</Label>
                  <Input id="org-phone" defaultValue="+1 (555) 123-4567" />
                </div>
                <div>
                  <Label htmlFor="org-address">Address</Label>
                  <Input id="org-address" defaultValue="123 Harbor Street, Marina Bay" />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="billing" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Current Plan</h4>
                  <p className="text-sm text-muted-foreground mb-2">Professional Plan - $99/month</p>
                  <p className="text-sm">Next billing date: June 30, 2025</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Payment Method</h4>
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center">
                        VISA
                      </div>
                      <span className="text-sm">•••• •••• •••• 4242</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Update
                    </Button>
                  </div>
                </div>
                <div>
                  <Button variant="outline" className="w-full">
                    View Billing History
                  </Button>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="security" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Login Alerts</Label>
                    <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>API Access</Label>
                    <p className="text-sm text-muted-foreground">Allow API access to your account</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Active Sessions</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="text-sm font-medium">Current Session</p>
                        <p className="text-xs text-muted-foreground">Chrome on Windows • Singapore</p>
                      </div>
                      <span className="text-xs text-green-600">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="text-sm font-medium">Mobile App</p>
                        <p className="text-xs text-muted-foreground">iOS App • Last seen 2 hours ago</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Revoke
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <Button variant="destructive" className="w-full">
                    Sign Out All Devices
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="flex items-center justify-between">
            {accountSaveSuccess && <span className="text-sm text-green-600">Account settings saved successfully!</span>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAccountSettingsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAccountSettings}>Save Changes</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>User Preferences</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="regional" className="mt-4">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="regional">Regional</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="regional" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="ms">Bahasa Melayu</SelectItem>
                      <SelectItem value="ta">தமிழ்</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Singapore">Singapore (GMT+8)</SelectItem>
                      <SelectItem value="Asia/Kuala_Lumpur">Kuala Lumpur (GMT+8)</SelectItem>
                      <SelectItem value="Asia/Jakarta">Jakarta (GMT+7)</SelectItem>
                      <SelectItem value="Asia/Bangkok">Bangkok (GMT+7)</SelectItem>
                      <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="time-format">Time Format</Label>
                  <Select value={timeFormat} onValueChange={setTimeFormat}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24-hour (14:30)</SelectItem>
                      <SelectItem value="12">12-hour (2:30 PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="MYR">MYR - Malaysian Ringgit</SelectItem>
                      <SelectItem value="IDR">IDR - Indonesian Rupiah</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Sound Notifications</Label>
                    <p className="text-sm text-muted-foreground">Play sound for notifications</p>
                  </div>
                  <Switch checked={soundNotifications} onCheckedChange={setSoundNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Digest</Label>
                    <p className="text-sm text-muted-foreground">Receive daily email summary</p>
                  </div>
                  <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Save</Label>
                    <p className="text-sm text-muted-foreground">Automatically save form changes</p>
                  </div>
                  <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <DialogFooter className="flex items-center justify-between">
            {preferencesSaveSuccess && <span className="text-sm text-green-600">Preferences saved successfully!</span>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPreferencesOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePreferences}>Save Preferences</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Help & Support</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="faq" className="mt-4">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
            </TabsList>
            <TabsContent value="faq" className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">How do I add a new gondola?</h4>
                  <p className="text-sm text-muted-foreground">
                    Navigate to the Gondolas page and click the "Add Gondola" button. Fill in the required information
                    including gondola ID, specifications, and certificates.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">How do I track certificate expiry?</h4>
                  <p className="text-sm text-muted-foreground">
                    Certificate expiry dates are automatically tracked. You'll receive notifications 30 days before
                    expiry. Check the dashboard for upcoming expirations.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">How do I generate reports?</h4>
                  <p className="text-sm text-muted-foreground">
                    Use the "Generate Report" button on the dashboard to create comprehensive reports. You can customize
                    the date range and data included.
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">How do I manage user permissions?</h4>
                  <p className="text-sm text-muted-foreground">
                    User permissions are managed through the Account Settings. Contact your administrator to modify user
                    roles and access levels.
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="contact" className="space-y-4">
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
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHelpOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={signOutConfirmOpen} onOpenChange={setSignOutConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Sign Out</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to sign out? You will need to log in again to access your account.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSignOutConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setSignOutConfirmOpen(false)
                alert("Signing out... Redirecting to login page.")
                // In a real app, this would handle logout logic
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
