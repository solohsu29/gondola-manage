'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import ProfilePhotoUpload from '../../../components/modules/profile/ProfilePhotoUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Camera, Save, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { useUserInfo } from '@/hooks/useUserInfo'
import { toast } from 'sonner'
import * as yup from 'yup'
import { useSessionInfo } from '../../../components/modules/profile/sessionHooks'
import getBase64 from '@/app/utils/getBase64'

export default function ProfilePage () {
  const sessionInfo = useSessionInfo()
  const [currentPassword, setCurrentPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false)
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(
    null
  )
  const [newPassword, setNewPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [localProfile, setLocalProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    department: '',
    photoUrl: '',
    photoData: ''
  })
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    certificateExpiry: true,
    maintenanceReminders: true,
    projectUpdates: false,
    weeklyReports: true
  })
  const { user } = useUserInfo()

  const passwordChangeSchema = yup.object().shape({
    currentPassword: yup.string().required('Current password is required'),
    newPassword: yup
      .string()
      .required('New password is required')
      .min(6, 'New password must be at least 6 characters')
      .notOneOf(
        [yup.ref('currentPassword')],
        'New password must be different from current password'
      ),
    confirmPassword: yup
      .string()
      .required('Confirm password is required')
      .oneOf([yup.ref('newPassword')], 'New passwords do not match')
  })

  const { profileData, profileLoading, fetchProfile, updateProfile } =
    useAppStore()

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Sync localProfile with store profileData
  useEffect(() => {
    if (profileData) {
      setLocalProfile({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        email: profileData.email || user?.email || '',
        phone: profileData.phone || '',
        jobTitle: profileData.jobTitle || '',
        department: profileData.department || '',
        photoUrl: profileData.photoUrl || '',
        photoData: profileData?.photoData
      })
    }
  }, [profileData, user])

  // Load notification preferences from backend profileData
  useEffect(() => {
    if (profileData && profileData.notificationPreferences) {
      try {
        const prefs =
          typeof profileData.notificationPreferences === 'string'
            ? JSON.parse(profileData.notificationPreferences)
            : profileData.notificationPreferences
        setNotifications({
          emailNotifications: prefs.emailNotifications ?? true,
          pushNotifications: prefs.pushNotifications ?? true,
          certificateExpiry: prefs.certificateExpiry ?? true,
          maintenanceReminders: prefs.maintenanceReminders ?? true,
          projectUpdates: prefs.projectUpdates ?? false,
          weeklyReports: prefs.weeklyReports ?? true
        })
      } catch (err: any) {
        toast.error('Failed to load notification preferences')
        // fallback to defaults
      }
    }
  }, [profileData])

  const handleProfileSave = async () => {
    try {
      await updateProfile({
        firstName: localProfile.firstName,
        lastName: localProfile.lastName,
        phone: localProfile.phone,
        jobTitle: localProfile.jobTitle,
        department: localProfile.department,
        photoUrl: localProfile.photoUrl
      })

      toast.success('Success!', {
        description: 'Profile information updated successfully!',
        className: 'bg-[#14a44d] text-white'
      })
    } catch (err: any) {
      // profileError from store will be shown
    }
  }

  // Save notification preferences to backend
  async function handleNotificationSave () {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...localProfile,
          notificationPreferences: notifications
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save preferences')
      // Update local state with latest from backend (in case backend normalizes/overwrites)
      if (data.notificationPreferences) {
        const prefs =
          typeof data.notificationPreferences === 'string'
            ? JSON.parse(data.notificationPreferences)
            : data.notificationPreferences
        setNotifications({
          emailNotifications: prefs.emailNotifications ?? true,
          pushNotifications: prefs.pushNotifications ?? true,
          certificateExpiry: prefs.certificateExpiry ?? true,
          maintenanceReminders: prefs.maintenanceReminders ?? true,
          projectUpdates: prefs.projectUpdates ?? false,
          weeklyReports: prefs.weeklyReports ?? true
        })
      }
      toast.success('Preferences saved!', {
        description: 'Notification preferences updated successfully.',
        className: 'bg-[#14a44d] text-white'
      })
    } catch (err: any) {
      toast.error('Failed to save preferences', {
        description: err.message || 'Unknown error',
        className: 'bg-[#dc2626] text-white'
      })
    }
  }

  const handlePasswordChange = async () => {
    setPasswordChangeError(null)
    try {
      await passwordChangeSchema.validate({
        currentPassword,
        newPassword,
        confirmPassword
      })
    } catch (err) {
      if (err instanceof yup.ValidationError) {
        setPasswordChangeError(err.errors[0])
        return
      }
    }
    setPasswordChangeLoading(true)
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })
      const data = await res.json()
      if (!res.ok) {
        setPasswordChangeError(data.error || 'Failed to change password.')
        setPasswordChangeLoading(false)
        return
      }
      toast.success('Password changed successfully!', {
        className: 'bg-[#14a44d] text-white'
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordChangeError(err.message || 'Failed to change password.')
    } finally {
      setPasswordChangeLoading(false)
    }
  }

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25
    if (/\d/.test(password)) strength += 25
    if (/[^a-zA-Z0-9]/.test(password)) strength += 25
    return strength
  }

  if (profileLoading || !localProfile) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        Loading...
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto py-6 px-4'>
        <div className='mb-6'>
          <Link
            href='/'
            className='inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Dashboard
          </Link>
          <h1 className='text-3xl font-bold'>Profile Settings</h1>
          <p className='text-gray-600 mt-2'>
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue='profile' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='profile'>Profile Information</TabsTrigger>
            <TabsTrigger value='security'>Security</TabsTrigger>
            <TabsTrigger value='notifications'>Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value='profile'>
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and profile details
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='flex items-center space-x-4'>
                  <Avatar className='h-20 w-20'>
                    {localProfile && localProfile.photoData ? (
                      <img
                        src={`data:image/*;base64,${getBase64(
                          localProfile.photoData
                        )}`}
                        alt={localProfile.firstName || ''}
                        className='h-20 w-20 rounded-full object-cover'
                      />
                    ) : localProfile && localProfile.photoUrl ? (
                      <img
                        src={localProfile.photoUrl}
                        alt={localProfile.firstName || ''}
                        className='h-20 w-20 rounded-full object-cover'
                      />
                    ) : (
                      <AvatarFallback>
                        {localProfile && localProfile.firstName
                          ? localProfile.firstName[0]
                          : user?.email?.[0] || 'U'}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div>
                    <ProfilePhotoUpload
                      photoUrl={localProfile.photoUrl}
                      onUploaded={(url: string) =>
                        setLocalProfile({ ...localProfile, photoUrl: url })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='firstName'>First Name</Label>
                    <Input
                      id='firstName'
                      value={localProfile?.firstName || ''}
                      onChange={e =>
                        setLocalProfile({
                          ...localProfile,
                          firstName: e.target.value
                        })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='lastName'>Last Name</Label>
                    <Input
                      id='lastName'
                      value={localProfile?.lastName || ''}
                      onChange={e =>
                        setLocalProfile({
                          ...localProfile,
                          lastName: e.target.value
                        })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email Address</Label>
                    <Input
                      id='email'
                      type='email'
                      value={localProfile?.email || ''}
                      onChange={e =>
                        setLocalProfile({
                          ...localProfile,
                          email: e.target.value
                        })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Phone Number</Label>
                    <Input
                      id='phone'
                      value={localProfile?.phone || ''}
                      onChange={e =>
                        setLocalProfile({
                          ...localProfile,
                          phone: e.target.value
                        })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='jobTitle'>Job Title</Label>
                    <Input
                      id='jobTitle'
                      value={localProfile?.jobTitle || ''}
                      onChange={e =>
                        setLocalProfile({
                          ...localProfile,
                          jobTitle: e.target.value
                        })
                      }
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='department'>Department</Label>
                    <Input
                      id='department'
                      value={localProfile?.department || ''}
                      onChange={e =>
                        setLocalProfile({
                          ...localProfile,
                          department: e.target.value
                        })
                      }
                    />
                  </div>
                </div>

                <div className='flex justify-end'>
                  <Button
                    onClick={handleProfileSave}
                    className='flex items-center gap-2'
                  >
                    <Save className='h-4 w-4' />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='security'>
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium'>Change Password</h3>
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='currentPassword'>Current Password</Label>
                      <div className='relative'>
                        <Input
                          id='currentPassword'
                          type={'password'}
                          placeholder='Enter current password'
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='newPassword'>New Password</Label>
                      <div className='relative'>
                        <Input
                          id='newPassword'
                          type={'password'}
                          placeholder='Enter new password'
                          value={newPassword}
                          onChange={e => {
                            setNewPassword(e.target.value)
                            setPasswordStrength(
                              calculatePasswordStrength(e.target.value)
                            )
                          }}
                        />
                      </div>
                      <div className='text-xs text-foreground mt-1'>
                        Must be 8+ characters with uppercase, lowercase, number,
                        and special character
                      </div>
                      {newPassword && (
                        <div className='space-y-2'>
                          <div className='flex justify-between text-sm'>
                            <span>Password Strength</span>
                            <span
                              className={`font-medium ${
                                passwordStrength < 50
                                  ? 'text-red-600'
                                  : passwordStrength < 75
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                              }`}
                            >
                              {passwordStrength < 25
                                ? 'Very Weak'
                                : passwordStrength < 50
                                ? 'Weak'
                                : passwordStrength < 75
                                ? 'Good'
                                : 'Strong'}
                            </span>
                          </div>
                          <div className='w-full bg-gray-200 rounded-full h-2'>
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                passwordStrength < 25
                                  ? 'bg-red-500'
                                  : passwordStrength < 50
                                  ? 'bg-red-400'
                                  : passwordStrength < 75
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${passwordStrength}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className='space-y-2'>
                      <Label htmlFor='confirmPassword'>
                        Confirm New Password
                      </Label>
                      <div className='relative'>
                        <Input
                          id='confirmPassword'
                          type={'password'}
                          placeholder='Confirm new password'
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  {passwordChangeError && (
                    <div className='text-red-500 text-sm mb-2'>
                      {passwordChangeError}
                    </div>
                  )}
                  <div className='flex justify-end'>
                    <Button
                      onClick={handlePasswordChange}
                      disabled={passwordChangeLoading}
                    >
                      {passwordChangeLoading
                        ? 'Updating...'
                        : 'Update Password'}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className='space-y-4'>
                  <h3 className='text-lg font-medium'>Session Management</h3>
                  <div className='space-y-2'>
                    <p className='text-sm text-gray-600'>
                      Current session:{' '}
                      {sessionInfo ? sessionInfo.userAgent : 'Loading...'}
                    </p>
                    <p className='text-sm text-foreground'>
                      Last login:{' '}
                      {sessionInfo ? sessionInfo.lastLogin : 'Loading...'}
                    </p>
                  </div>
                  <Button variant='outline'>Sign out of all devices</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='notifications'>
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-4'>
                  <h3 className='text-lg font-medium'>General Notifications</h3>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium'>Email Notifications</p>
                        <p className='text-sm text-foreground'>
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={notifications.emailNotifications}
                        onCheckedChange={checked =>
                          setNotifications({
                            ...notifications,
                            emailNotifications: checked
                          })
                        }
                      />
                    </div>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium'>Push Notifications</p>
                        <p className='text-sm text-foreground'>
                          Receive push notifications in browser
                        </p>
                      </div>
                      <Switch
                        checked={notifications.pushNotifications}
                        onCheckedChange={checked =>
                          setNotifications({
                            ...notifications,
                            pushNotifications: checked
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className='space-y-4'>
                  <h3 className='text-lg font-medium'>System Notifications</h3>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium'>Certificate Expiry Alerts</p>
                        <p className='text-sm text-foreground'>
                          Get notified when certificates are about to expire
                        </p>
                      </div>
                      <Switch
                        checked={notifications.certificateExpiry}
                        onCheckedChange={checked =>
                          setNotifications({
                            ...notifications,
                            certificateExpiry: checked
                          })
                        }
                      />
                    </div>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium'>Maintenance Reminders</p>
                        <p className='text-sm text-foreground'>
                          Receive reminders for scheduled maintenance
                        </p>
                      </div>
                      <Switch
                        checked={notifications.maintenanceReminders}
                        onCheckedChange={checked =>
                          setNotifications({
                            ...notifications,
                            maintenanceReminders: checked
                          })
                        }
                      />
                    </div>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium'>Project Updates</p>
                        <p className='text-sm text-foreground'>
                          Get notified about project status changes
                        </p>
                      </div>
                      <Switch
                        checked={notifications.projectUpdates}
                        onCheckedChange={checked =>
                          setNotifications({
                            ...notifications,
                            projectUpdates: checked
                          })
                        }
                      />
                    </div>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='font-medium'>Weekly Reports</p>
                        <p className='text-sm text-foreground'>
                          Receive weekly summary reports
                        </p>
                      </div>
                      <Switch
                        checked={notifications.weeklyReports}
                        onCheckedChange={checked =>
                          setNotifications({
                            ...notifications,
                            weeklyReports: checked
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className='flex justify-end'>
                  <Button
                    onClick={handleNotificationSave}
                    className='flex items-center gap-2'
                  >
                    <Save className='h-4 w-4' />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
