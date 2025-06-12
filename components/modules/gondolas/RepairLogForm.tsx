import { DialogFooter } from '@/components/ui/dialog'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function RepairLogForm ({
  gondolaId,
  onClose,
  onSubmit
}: {
  gondolaId: string
  onClose: any
  onSubmit: any
}) {
  const [type, setType] = useState('Repair')
  const [description, setDescription] = useState('')
  const [partName, setPartName] = useState('')
  const [cost, setCost] = useState('')
  const [isChargeable, setIsChargeable] = useState(false)
  const [technician, setTechnician] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    if (!description || !cost || !technician) {
      alert('Please fill in all required fields')
      return
    }
    setLoading(true)

    const repairId = `RL-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 900) + 100
    ).padStart(3, '0')}`
    const newRepair = {
      id: repairId,
      date: new Date().toLocaleDateString(),
      type,
      description,
      partName: partName || 'N/A',
      cost: Number.parseFloat(cost),
      isChargeable,
      technician,
      status: 'completed'
    }
    onSubmit(newRepair)
    setLoading(false)
    onClose()
  }

  return (
    <div className='grid gap-4 py-4'>
      <div className='space-y-2'>
        <Label htmlFor='repairType'>Type *</Label>
        <Select
          name='repairType'
          onValueChange={value => setType(value)}
          defaultValue='Repair'
        >
          <SelectTrigger>
            <SelectValue placeholder='Select type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='Repair'>Repair</SelectItem>
            <SelectItem value='Part Replacement'>Part Replacement</SelectItem>
            <SelectItem value='Maintenance'>Maintenance</SelectItem>
            <SelectItem value='Inspection Fix'>Inspection Fix</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='space-y-2'>
        <Label htmlFor='description'>Description *</Label>
        <Input
          id='description'
          placeholder='Describe the repair or work done'
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='partName'>Part Name/Details</Label>
        <Input
          id='partName'
          placeholder='Enter part name or additional details'
          value={partName}
          onChange={e => setPartName(e.target.value)}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='cost'>Cost (USD) *</Label>
        <Input
          id='cost'
          type='number'
          placeholder='Enter cost amount'
          value={cost}
          onChange={e => setCost(e.target.value)}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='technician'>Technician *</Label>
        <Select name='technician' onValueChange={value => setTechnician(value)}>
          <SelectTrigger>
            <SelectValue placeholder='Select technician' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='Mike Johnson'>Mike Johnson</SelectItem>
            <SelectItem value='Sarah Wilson'>Sarah Wilson</SelectItem>
            <SelectItem value='John Smith'>John Smith</SelectItem>
            <SelectItem value='Jane Doe'>Jane Doe</SelectItem>
            <SelectItem value='Other'>Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className='flex items-center space-x-2'>
        <input
          type='checkbox'
          id='chargeable'
          checked={isChargeable}
          onChange={e => setIsChargeable(e.target.checked)}
          className='rounded border-gray-300'
        />
        <Label htmlFor='chargeable' className='text-sm font-medium'>
          Mark as chargeable to client
        </Label>
      </div>
      <DialogFooter>
        <Button type='button' variant='outline' onClick={onClose}>
          Cancel
        </Button>
        <Button type='submit' onClick={handleSubmit} disabled={loading}>
          Log Repair/Part
        </Button>
      </DialogFooter>
    </div>
  )
}
