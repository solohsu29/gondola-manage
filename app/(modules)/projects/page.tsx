'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Plus, Search, Edit } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Project } from '@/types'
import { DataTable } from '@/components/common/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import { toast } from 'sonner'
import exportToCSV from '@/components/modules/projects/exportToCSV'
import { formatDateDMY } from '@/app/utils/formatDate'

function StatusBadge ({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge>Active</Badge>
    case 'completed':
      return <Badge variant='completed'>Completed</Badge>
    case 'cancelled':
      return <Badge variant='destructive'>Cancelled</Badge>
    default:
      return <Badge variant='outline'>{status}</Badge>
  }
}




export default function ProjectsPage () {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

  const { projects, updateProject, fetchProjects, projectsLoading } =
    useAppStore()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editData, setEditData] = useState({
    client: '',
    site: '',
    status: '',
    endDate: ''
  })
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  )
  const [activeTab, setActiveTab] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const projectColumns: ColumnDef<Project>[] = [
    {
      accessorKey: 'id',
      header: 'Project ID',
      cell: ({ row }) => (
        <a
          href={`/projects/${row.original.id}`}
          className='text-blue-600 hover:underline'
        >
          {row.original.id?.slice(0, 10)}
        </a>
      )
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => row.original.projectName || '-'
    },
    {
      accessorKey: 'client',
      header: 'Client',
      cell: ({ row }) => row.original.client || '-'
    },
    {
      accessorKey: 'site',
      header: 'Site',
      cell: ({ row }) => row.original.site || '-'
    },
    {
      accessorKey: 'gondolas',
      header: 'Gondolas',
      cell: ({ row }) =>
        Array.isArray(row.original.gondolas) ? row.original.gondolas.length : 0
    },
    {
      accessorKey: 'created',
      header: 'Created',
      cell: ({ row }) =>
        row.original.created
          ? formatDateDMY(new Date(row.original.created).toLocaleDateString())
          : '-'
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        return <StatusBadge status={row.original.status} />
      }
    },
    {
      accessorKey: 'endDate',
      header: 'End Date',
      cell: ({ row }) =>
        row.original.endDate
          ? formatDateDMY(new Date(row.original.endDate).toLocaleDateString())
          : '-'
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className='flex gap-2'>
          {/* <Button variant='outline' size='sm' asChild>
            <Link href={`/projects/${row.original.id}`}>View</Link>
          </Button> */}
          <Button variant='outline' size='sm' asChild>
            <Link href={`/projects/${row.original.id}/edit`}>Edit</Link>
          </Button>
          <Button variant='outline' size='sm' onClick={() => {
            setDeleteDialogOpen(true);
            setProjectToDelete(row.original);
          }}>
            Delete
          </Button>
        </div>
      )
    }
  ]
  useEffect(() => {
    fetchProjects()
  }, [])

  const handleSaveEdit = async (projectId: string | null) => {
    setLoading(true)
    if (!projectId) return
    try {
      await updateProject(projectId, {
        client: editData.client,
        site: editData.site,
        status: editData.status as 'active' | 'completed' | 'pending',
        endDate: editData.endDate
      })
      toast.success(`Project updated!`, {
        description: `Project ${projectId} updated successfully!`,
        className: 'bg-[#14A44D] text-white'
      })
      setIsEditDialogOpen(false)
      setSelectedProjectId(null)
      setLoading(false)
    } catch (error) {
      toast.error('Update failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
        className: 'bg-destructive text-destructive-foreground'
      })
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(project => {
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        project.id.toLowerCase().includes(query) ||
        project.client.toLowerCase().includes(query) ||
        project.site.toLowerCase().includes(query) ||
        project?.projectName?.toLowerCase().includes(query)
      )
    }

    // Filter by tab
    if (activeTab === 'active') return project.status === 'active'
    if (activeTab === 'completed') return project.status === 'completed'

    // "all" tab
    return true
  })
const handleDeleteProject = async () => {
  if (!projectToDelete) return;
  setLoading(true);
  try {
    const res = await fetch(`/api/project/${projectToDelete.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to delete project');
    }
    toast.success('Project deleted', {
      description: `${projectToDelete.projectName || projectToDelete.id} deleted successfully.`,
      className: 'bg-[#14AA4d] text-white',
    });
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
    fetchProjects();
  } catch (err: any) {
    toast.error('Delete failed', {
      description: err.message || 'Unknown error',
      className: 'bg-destructive text-white',
    });
  } finally {
    setLoading(false);
  }
}
  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Projects</h1>
        <div className='flex gap-2'>
          <Button className='flex items-center gap-2' asChild>
            <Link href='/projects/new'>
              <Plus className='h-4 w-4' />
              <span>New Project</span>
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className='p-0'>
          {/* Delete Project Confirmation Dialog */}
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogContent className='sm:max-w-[400px]'>
              <DialogHeader>
                <DialogTitle>Delete Project</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete{' '}
                  <span className='font-semibold'>{projectToDelete?.projectName || projectToDelete?.id}</span>?
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant='outline'
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant='destructive'
                  onClick={handleDeleteProject}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className='p-4 flex flex-col sm:flex-row gap-4 border-b'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-5 h-4 w-4 text-gray-400' />
              <Input
                type='search'
                placeholder='Search projects...'
                className='pl-10'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                className='flex items-center gap-2'
                onClick={() => exportToCSV(filteredProjects)}
              >
                <Download className='h-4 w-4' />
                <span>Export</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue='all' onValueChange={setActiveTab}>
            <div className='px-4 pt-4'>
              <TabsList>
                <TabsTrigger value='all'>All Projects</TabsTrigger>
                <TabsTrigger value='active'>Active</TabsTrigger>
                <TabsTrigger value='completed'>Completed</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value='all' className='mt-0'>
              <DataTable
                columns={projectColumns}
                data={filteredProjects}
                pageSize={10}
                loading={projectsLoading}
              />
            </TabsContent>
            <TabsContent value='active' className='mt-0'>
              <DataTable
                columns={projectColumns}
                data={filteredProjects}
                pageSize={10}
                loading={projectsLoading}
              />
            </TabsContent>
            <TabsContent value='completed' className='mt-0'>
              <DataTable
                columns={projectColumns}
                data={filteredProjects}
                pageSize={10}
                loading={projectsLoading}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Single Edit Dialog rendered outside the table */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project information for {selectedProjectId}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-client'>Client Name</Label>
              <Input
                id='edit-client'
                value={editData.client}
                onChange={e =>
                  setEditData({ ...editData, client: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-site'>Site Name</Label>
              <Input
                id='edit-site'
                value={editData.site}
                onChange={e =>
                  setEditData({ ...editData, site: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-status'>Status</Label>
              <Select
                value={editData.status}
                onValueChange={value =>
                  setEditData({ ...editData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Select status' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>Active</SelectItem>
                  <SelectItem value='completed'>Completed</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='edit-endDate'>End Date (Optional)</Label>
              <Input
                id='edit-endDate'
                type='date'
                value={editData.endDate}
                onChange={e =>
                  setEditData({ ...editData, endDate: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              onClick={() => handleSaveEdit(selectedProjectId)}
              disabled={loading}
            >
              {loading ? 'Saving...' : ' Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
