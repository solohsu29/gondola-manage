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
  onSubmit,
  initialData
}: {
  gondolaId: string
  onClose: any
  onSubmit: any
  initialData?: any
}) {
  const [type, setType] = useState(initialData?.type || 'Repair')
  const [description, setDescription] = useState(initialData?.description || '')
  const [partName, setPartName] = useState(initialData?.partName || '')
  const [cost, setCost] = useState(initialData?.cost !== undefined ? String(initialData.cost) : '')
  const [isChargeable, setIsChargeable] = useState(initialData?.isChargeable || false)
  const [technician, setTechnician] = useState(initialData?.technician || '')
  const [repairDate, setRepairDate] = useState(
    initialData?.date
      ? typeof initialData.date === 'string' && initialData.date.length >= 10
        ? initialData.date.slice(0, 10)
        : ''
      : new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    if (!description || !cost || !technician || !repairDate) {
      alert('Please fill in all required fields')
      return
    }
    setLoading(true)

    const repairId = initialData?.id || `RL-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 900) + 100
    ).padStart(3, '0')}`;
    const newRepair = {
      id: repairId,
      date: repairDate,
      type,
      description,
      partName: partName || 'N/A',
      cost: Number.parseFloat(cost),
      isChargeable,
      technician,
      status: initialData?.status || 'completed'
    };
    onSubmit(newRepair);
    setLoading(false);
    onClose();
  }

  return (
    <div className='grid gap-4 py-4'>
      <div className='space-y-2'>
        <Label htmlFor='repairDate'>Repair Date *</Label>
        <Input
          id='repairDate'
          type='date'
          value={repairDate}
          onChange={e => setRepairDate(e.target.value)}
        />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='repairType'>Type *</Label>
        <Select
          name='repairType'
          onValueChange={value => setType(value)}
          defaultValue={type}
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
        <Input
          id='technician'
          type='technician'
          placeholder='Enter Technician'
          value={technician}
          onChange={e => setTechnician(e.target.value)}
        />
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
